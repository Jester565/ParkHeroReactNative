import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight, Text, Modal, FlatList, AppState } from 'react-native';
import { Icon, Button, FormInput } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import AwsExports from '../../AwsExports';
import PassParallax from '../pass/PassParallax';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import Amplify, { API, graphqlOperation, Hub } from 'aws-amplify';
import { Switch } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-root-toast';
import Commons from '../../Commons';
import { ViewPager } from 'rn-viewpager';
import { PagerDotIndicator, IndicatorViewPager } from 'rn-viewpager';
import NetManager from '../../NetManager';
import FastPasses from '../pass/FastPasses';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Party extends React.Component {
    constructor(props) {
        super(props);

        this.PARTY_INVITE_TYPE = 1;
        this.ANIMATION_DURATION = 500;

        this.pagerI = 0;

        this.state = {
            partyMembers: [],
            partyPasses: [],
            partyInvitations: [],
            splitters: [],
            inviteSubmitting: false, //Disables invite accept/decline buttons when true
            leaveSubmitting: false
        };
    }

    componentWillMount() {
        Hub.listen('inviteToParty', this, 'Party-InviteToParty');
        Hub.listen('leaveParty', this, 'Party-LeaveParty');
        Hub.listen('acceptPartyInvite', this, 'Party-AcceptPartyInvite');
        Hub.listen('deleteInvite', this, 'Party-DeleteInvite');

        NetManager.subscribe(this.handleNet)
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
    }

    handleNet = (event) => {
        if (event == 'netSignIn') {
            this.refreshAll();
            if (this.focusListener == null) {
                this.focusListener = this.props.navigation.addListener('willFocus', () => {
                    this.refreshAll();
                });
            }
        }
    }

    refreshAll = () => {
        this.refreshPartyPasses();
        this.refreshPartyMembers();
        this.refreshInvites();
    }

    refreshPartyPasses = () => {
        API.graphql(graphqlOperation(queries.getPartyPasses)).then((data) => {
            var partyPassResp = data.data.getPartyPasses;
            console.log("PARTY PASSES: ", JSON.stringify(partyPassResp));

            var newPasses = [];
            for (var userPasses of partyPassResp.userPasses) {
                for (var pass of userPasses.passes) {
                    pass.user = userPasses.user;
                    newPasses.push(pass);
                }
            }
            this.setState({
                partyPasses: newPasses,
                splitters: (partyPassResp.splitters != null)? partyPassResp.splitters: null
            });
        });
    }

    refreshPartyMembers = () => {
        API.graphql(graphqlOperation(queries.getPartyMembers)).then((data) => {
            var partyMembers = data.data.getPartyMembers;
            var refinedPartyMembers = [];
            for (var partyMember of partyMembers) {
                if (partyMember.id != this.props.user.id) {
                    refinedPartyMembers.push(partyMember);
                }
            }
            this.setState({
                partyMembers: refinedPartyMembers
            });
        });
    }

    refreshInvites = () => {
        API.graphql(graphqlOperation(queries.getInvites)).then((data) => {
            var invites = data.data.getInvites;
            
            var partyInvites = [];
            for (var invite of invites) {
                if (invite.type == this.PARTY_INVITE_TYPE && !invite.isOwner) {
                    partyInvites.push(invite.user);
                }
            }
            this.setState({
                partyInvitations: partyInvites
            });
        });
    }

    onReqAcceptPartyInvitation = () => {
        this.setState({
            inviteSubmitting: true
        }, () => {
            if (this.pagerI >= 0 && this.pagerI < this.state.partyInvitations.length) {
                var user = this.state.partyInvitations[this.pagerI];
                API.graphql(graphqlOperation(mutations.acceptPartyInvite, { inviterID: user.id })).then((data) => {
                    this.refreshAll();
                }).catch((e) => {
                    console.warn("Failed to accept party invite: ", e);
                    this.setState({
                        inviteSubmitting: false
                    });
                });
            }
        });
    }
    
    onReqDeclinePartyInvitation = () => {
        this.setState({
            inviteSubmitting: true
        }, () => {
            if (this.pagerI >= 0 && this.pagerI < this.state.partyInvitations.length) {
                var user = this.state.partyInvitations[this.pagerI];
                API.graphql(graphqlOperation(mutations.deleteInvite, { isOwner: false, type: this.PARTY_INVITE_TYPE, userID: user.id })).then((data) => {
                    var partyInvitations = Commons.removeFromArr(this.state.partyInvitations, {
                        id: user.id
                    }, this.isUserEqual);
                    this.setState({
                        partyInvitations: partyInvitations,
                        inviteSubmitting: false
                    })
                }).catch((e) => {
                    console.warn("Failed to decline party invite: ", e);
                    this.setState({
                        inviteSubmitting: false
                    });
                });
            }
        });
    }

    onReqLeaveParty = () => {
        //On success remember to set inviteSumitting to false
        this.setState({
            leaveSubmitting: true
        }, () => {
            API.graphql(graphqlOperation(mutations.leaveParty)).then(() => {
                this.setState({
                    inviteSubmitting: false
                });
                this.refreshAll();
            }).catch((e) => {
                console.warn("Failed to leave party: ", e);
                this.setState({
                    leaveSubmitting: false
                });
            });
        });
    }

    // Default handler for listening events
    onHubCapsule(capsule) {
        const { channel, payload } = capsule;
        if (channel == 'inviteToParty') {
            this.onInvitedToParty(payload.user);
        } else if (channel == 'leaveParty') {
            this.onLeaveParty(payload.userID);
        } else if (channel == 'acceptPartyInvite') {
            this.onPartyInviteAccepted(payload.user);
        } else if (channel == 'deleteInvite') {
            this.onInviteDeleted(payload.userID, payload.isOwner, payload.type);
        }
    }

    isUserEqual = (e1, e2) => {
        return (e1.id == e2.id);
    }

    onInvitedToParty = (user) => {
        var partyInvites = Commons.addToArr(this.state.partyInvitations, user, this.isUserEqual);
        this.setState({
            partyInvitations: partyInvites
        });
    }

    onLeaveParty = (userID) => {
        this.refreshPartyPasses();

        var partyMembers = Commons.removeFromArr(this.state.partyMembers, { id: userID }, this.isUserEqual);
        this.setState({
            partyMembers: partyMembers,
            inviteSubmitting: (partyMembers.length == 0)? false: this.state.inviteSubmitting
        });
    }

    onPartyInviteAccepted = (user) => {
        this.refreshPartyPasses();

        var partyMembers = Commons.addToArr(this.state.partyMembers, user, this.isUserEqual);
        this.setState({
            partyMembers: partyMembers,
            leaveSubmitting: false
        });
    }

    onInviteDeleted = (userID, isOwner, type) => {
        if (type == this.PARTY_INVITE_TYPE && !isOwner) {
            var partyInvites = Commons.removeFromArr(this.state.partyInvitations, { id: userID }, this.isUserEqual);
            this.setState({
                partyInvitations: partyInvites
            });
        }
    }

    addPass = (passID) => {
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(mutations.updatePass, { 
                passID: passID,
                isEnabled: true
            })).then((data) => {
                var userPass = data.data.updatePass;
                var newPasses = [];
                if (this.state.partyPasses != null) {
                    newPasses = this.state.partyPasses.slice();
                }
                var pass = userPass.pass;
                pass.user = userPass.user;
                newPasses.push(pass);
                this.setState({
                    partyPasses: newPasses
                });
                resolve(userPass);
            }).catch((err) => {
                console.warn("ADD PASS ERROR: ", err);
                reject(err);
            });
        });
    }

    removePass = (passID) => {
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(mutations.removePass, { 
                passID: passID
            })).then(() => {
                var newPasses = [];
                if (this.state.partyPasses != null) {
                    for (var pass of this.state.partyPasses) {
                        if (pass.id != passID) {
                            newPasses.push(pass);
                        }
                    }
                }
                this.setState({
                    partyPasses: newPasses
                });
                resolve();
            }).catch((err) => {
                console.warn("REMOVE PASS ERROR: ", err);
                reject(err);
            });
        });
    }

    inviteKeyExtractor = (item, index) => {
        return item.id;
    }

    renderUserItem = (user) => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        console.log("PROFILE PIC: ", JSON.stringify(user));
        return (<View 
            style={{
                width: screenWidth, 
                height: screenHeight * 0.25
            }}>
            <CachedImage
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.25 }} 
            resizeMode={'cover'} 
            blurRadius={1} 
            source={{uri: S3_URL + user.profilePicUrl + "-0.webp"}}/>
            <CachedImage 
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.25 }} 
            resizeMode={'contain'} 
            source={{uri: S3_URL + user.profilePicUrl + "-3.webp"}}/>
            <Text style={{
                position: 'absolute',
                top: 0,
                left: screenWidth / 4.0,
                fontSize: 22,
                width: screenWidth / 2.0,
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(0, 0, 0, 0.9)',
                borderWidth: 2,
                borderRadius: 5,
                color: 'white'
            }}>{user.name}</Text>
        </View>);
    }

    onPageSelected = ({position})=> {
        this.pagerI = position;
    }

    renderInPartyHeader = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (
        <View style={{
            width: screenWidth
        }}>
            <IndicatorViewPager style={{
                width: screenWidth, 
                height: screenHeight * 0.25
            }}
            indicator={
                <PagerDotIndicator pageCount={this.state.partyMembers.length} />
            }
            onPageSelected={this.onPageSelected}>
                {
                    this.state.partyMembers.map(this.renderUserItem)
                }
            </IndicatorViewPager>
            <View style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: screenWidth,
                flexDirection: 'row',
                justifyContent: 'center'
            }}>
                <Button
                    title='LEAVE PARTY' 
                    disabled={this.state.leaveSubmitting}
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onReqLeaveParty}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
            </View>
        </View>);
    }

    renderPartyInviteHeader = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (
        <View style={{
            width: screenWidth
        }}>
            <IndicatorViewPager style={{
                width: screenWidth, 
                height: screenHeight * 0.25
            }}
            indicator={
                <PagerDotIndicator pageCount={this.state.partyInvitations.length} />
            }
            onPageSelected={this.onPageSelected}>
                {
                    this.state.partyInvitations.map(this.renderUserItem)
                }
            </IndicatorViewPager>
            <View style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: screenWidth,
                flexDirection: 'row',
                justifyContent: 'space-evenly'
            }}>
                <Button
                    title='JOIN PARTY' 
                    disabled={this.state.inviteSubmitting}
                    rounded={true} 
                    backgroundColor={'lime'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onReqAcceptPartyInvitation}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
                <Button
                    title='DECLINE' 
                    disabled={this.state.inviteSubmitting}
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onReqDeclinePartyInvitation}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
            </View>
        </View>);
    }

    renderPartyDescriptionHeader = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (<View style={{
            width: screenWidth,
            height: screenHeight * 0.25,
            justifyContent: 'center',
            alignContent: 'center'
        }}>
            <Text style={{
                fontSize: 30,
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(0, 0, 0, 0.9)',
                borderWidth: 2,
                borderRadius: 5,
                color: 'white'
            }}>Parties share FastPasses, Passes, and Locations</Text>
        </View>)
    }

    renderHeaderBackground = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (<Image 
            style={{ width: screenWidth, height: screenHeight * 0.4 }} 
            resizeMode={'cover'} 
            source={require('../../assets/partyHeader.jpg')} />);
    }

    onSplitterUpdate = (splitters) => {
        this.setState({
            splitters: splitters
        });
    }

    onPassExpand = () => {
        this.props.setPagingEnabled(false);
    }

    onPassContract = () => {
        this.props.setPagingEnabled(true);
    }

    render() {
        var screenHeight = Dimensions.get('window').height;

        var renderHeader = null;
        if (this.state.partyMembers != null && this.state.partyMembers.length > 0) {
            renderHeader = this.renderInPartyHeader;
        } else if (this.state.partyInvitations != null && this.state.partyInvitations.length > 0) {
            renderHeader = this.renderPartyInviteHeader;
        } else {
            renderHeader = this.renderPartyDescriptionHeader;
        }
        return (
            <PassParallax
            headerHeight={screenHeight * 0.25}
            renderHeaderForeground={renderHeader}
            renderHeaderBackground={this.renderHeaderBackground}
            splitters={this.state.splitters}
            editingEnabled={true}
            splittingEnabled={true}
            passes={this.state.partyPasses}
            navigation={this.props.navigation}
            currentUserID={this.props.user.id}
            addPass={this.addPass}
            removePass={this.removePass}
            groupID={"party"}
            onSplitterUpdate={this.onSplitterUpdate}
            onExpand={this.onPassExpand}
            onContract={this.onPassContract}>
                <View style={{
                    width: "100%",
                    flexDirection: 'column',
                    alignContent: 'center',
                    marginTop: 20
                }}>
                    <FastPasses />
                </View>
            </PassParallax>);
    }
}
