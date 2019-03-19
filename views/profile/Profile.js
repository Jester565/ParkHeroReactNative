import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight, Text, Modal } from 'react-native';
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

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Profile extends React.Component {
    static navigationOptions = {
        title: 'Profile',
        header: null
    };

    constructor(props) {
        super();
        this.FRIEND_INVITE_TYPE = 0;
        this.PARTY_INVITE_TYPE = 1;

        this.ANIMATION_DURATION = 500;

        const { navigation } = props;
        var user = navigation.getParam('user');
        var authenticated = navigation.getParam('authenticated');

        this.state = {
            user: user,
            authenticated: authenticated,
            passes: null,
            editing: false,
            passesExpanded: false,
            imagePickerOpen: false,
            username: null,
            imgUri: null,
            passError: null,
            isFriend: false,
            inParty: false,
            ownsPartyInvite: false,
            ownsFriendInvite: false,
            sentPartyInvite: false,
            sentFriendInvite: false
        };
    }

    componentWillMount() {
        this.refreshPasses();

        if (!this.isMe()) {
            Hub.listen('addFriend', this, 'Friends-AddFriend');
            Hub.listen('removeFriend', this, 'Friends-RemoveFriend');
            Hub.listen('inviteToParty', this, 'Friends-InviteToParty');
            Hub.listen('leaveParty', this, 'Friends-LeaveParty');
            Hub.listen('acceptPartyInvite', this, 'Friends-AcceptPartyInvite');
            Hub.listen('deleteInvite', this, 'Friends-DeleteInvite');

            this.refreshFriends();
            this.refreshPartyMembers();
            this.refreshInvites();
        }
    }
    
    refreshFriends = () => {
        API.graphql(graphqlOperation(queries.getFriends)).then((data) => {
            var friends = data.data.getFriends;
            for (var friend of friends) {
                if (friend.id == this.state.user.id) {
                    this.setState({
                        isFriend: true
                    });
                }
            }
        });
    }

    refreshPartyMembers = () => {
        API.graphql(graphqlOperation(queries.getPartyMembers)).then((data) => {
            var partyMembers = data.data.getPartyMembers;
            for (var partyMember of partyMembers) {
                if (partyMember.id == this.state.user.id) {
                    this.setState({
                        inParty: true
                    });
                }
            }
        });
    }

    refreshInvites = () => {
        API.graphql(graphqlOperation(queries.getInvites)).then((data) => {
            var invites = data.data.getInvites;
            
            for (var invite of invites) {
                if (invite.user.id == this.state.user.id) {
                    if (invite.type == this.FRIEND_INVITE_TYPE) {
                        if (invite.isOwner) {
                            this.setState({
                                sentFriendInvite: true
                            });
                        } else {
                            this.setState({
                                ownsFriendInvite: true
                            });
                        }
                    } else {
                        if (invite.isOwner) {
                            this.setState({
                                sentPartyInvite: true
                            });
                        } else {
                            this.setState({
                                ownsPartyInvite: true
                            });
                        }
                    }
                }
            }
        });
    }

    // Default handler for listening events
    onHubCapsule(capsule) {
        console.log("HUB INVOKED");
        const { channel, payload } = capsule;
        if (channel === 'addFriend') { 
            if (payload.user.id == this.state.user.id) {
                if (payload.isFriend) {
                    this.onFriendAdded(payload.user);
                } else { 
                    this.onFriendInviteAdded(payload.user); 
                }
            }
        } else if (channel == 'removeFriend') {
            if (payload.userID == this.state.user.id) {
                this.onFriendRemoved();
            }
        } else if (channel == 'inviteToParty') {
            if (payload.user.id == this.state.user.id) {
                this.onInvitedToParty();
            }
        } else if (channel == 'leaveParty') {
            if (payload.userID == this.state.user.id) {
                this.onLeaveParty();
            }
        } else if (channel == 'acceptPartyInvite') {
            if (payload.user.id == this.state.user.id) {
                this.onPartyInviteAccepted();
            }
        } else if (channel == 'deleteInvite') {
            if (payload.userID == this.state.user.id) {
                this.onInviteDeleted(payload.isOwner, payload.type);
            }
        }
    }

    onFriendAdded = () => {
        this.setState({
            isFriend: true,
            ownsFriendInvite: false,
            sentFriendInvite: false
        });
    }

    onFriendInviteAdded = () => {
        this.setState({
            ownsFriendInvite: true
        });
    }

    onFriendRemoved = () => {
        this.setState({
            isFriend: false
        });
    }

    onInvitedToParty = () => {
        this.setState({
            ownsPartyInvite: true,
            ownsFriendInvite: false
        });
    }

    onLeaveParty = () => {
        this.setState({
            inParty: false
        });
    }

    onPartyInviteAccepted = () => {
        this.setState({
            inParty: true,
            sentPartyInvite: false,
            ownsPartyInvite: false
        })
    }

    onInviteDeleted = (isOwner, type) => {
        if (type == this.FRIEND_INVITE_TYPE) {
            if (isOwner) {
                this.setState({
                    sentFriendInvite: false
                });
            } else {
                this.setState({
                    ownsFriendInvite: false
                });
            }
        } else {
            if (isOwner) {
                this.setState({
                    sentPartyInvite: false
                });
            } else {
                this.setState({
                    ownsPartyInvite: false
                });
            }
        }
    }

    onSignOut = () => {
        const { navigation } = this.props;
        var signOut = navigation.getParam('signOut');
        navigation.goBack();
        signOut();
    }

    onEdit = () => {
        this.hideNonEdit().then(() => {
            this.setState({
                editing: true,
                username: this.state.user.name
            }, () => {
                this.showEdit();
            })
        })
    }

    onCancelEdit = () => {
        this.hideEdit().then(() => {
            this.setState({
                editing: false,
                username: null,
                imgUri: null
            }, () => {
                this.showNonEdit();
            });
        });
    }

    onPassExpand = () => {
        if (this.state.editing) {
            this.hideEdit().then(() => {
                this.setState({
                    passesExpanded: true
                });
            });
        } else {
            this.hideNonEdit().then(() => {
                this.setState({
                    passesExpanded: true
                });
            });
        }
    }

    onPassContract = () => {
        this.setState({
            passesExpanded: false
        }, () => {
            if (this.state.editing) {
                this.showEdit();
            } else {
                this.showNonEdit();
            }
        });
    }

    onEditImage = () => {
        this.setState({
            imagePickerOpen: true
        });
    }

    onCameraPick = () => {
        ImagePicker.openCamera({
            width: 1000,
            height: 1000,
            cropping: true,
            includeBase64: true,
            rotation: 360
        }).then(image => {
            this.onImage(image);
        }).catch(() => {});
    }

    onGalleryPick = () => {
        ImagePicker.openPicker({
            width: 1000,
            height: 1000,
            cropping: true,
            includeBase64: true
        }).then(image => {
            this.onImage(image);
        }).catch(() => {});
    }

    onImage = (image) => {
        console.log("ON IMAGE: ", JSON.stringify(image));
        this.setState({
            imagePickerOpen: false,
            imgUri: `data:${image.mime};base64,${image.data}`
        });
    }

    closeImagePicker = () => {
        this.setState({
            imagePickerOpen: false
        });
    }

    refreshPasses = () => {
        API.graphql(graphqlOperation(queries.getUserPasses, { userID: this.state.user.id })).then((data) => {
            var allUserPasses = data.data.getUserPasses;
            var newPasses = [];
            for (var userPasses of allUserPasses) {
                for (var pass of userPasses.passes) {
                    pass.user = userPasses.user;
                    newPasses.push(pass);
                }
            }
            this.setState({
                passes: newPasses
            });
        }).catch((err) => {
            this.setState({
                passError: "Cannot Show Passes"
            });
        });
    }

    addPass = (passID) => {
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(mutations.updatePass, { 
                passID: passID,
                isEnabled: true
            })).then((data) => {
                var userPass = data.data.updatePass;
                var newPasses = [];
                if (this.state.passes != null) {
                    newPasses = this.state.passes.slice();
                }
                var pass = userPass.pass;
                pass.user = userPass.user;
                newPasses.push(pass);
                this.setState({
                    passes: newPasses
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
                if (this.state.passes != null) {
                    for (var pass of this.state.passes) {
                        if (pass.id != passID) {
                            newPasses.push(pass);
                        }
                    }
                }
                this.setState({
                    passes: newPasses
                });
                resolve();
            }).catch((err) => {
                console.warn("REMOVE PASS ERROR: ", err);
                reject(err);
            });
        });
    }

    showEdit = () => {
        this.refs._editFooter.bounceInUp(this.ANIMATION_DURATION);
        this.refs._nameEdit.bounceInLeft(this.ANIMATION_DURATION);
        this.refs._visibleSwitch.bounceInRight(this.ANIMATION_DURATION);
        return this.refs._soundSwitch.bounceInRight(this.ANIMATION_DURATION);
    }

    hideEdit = () => {
        this.refs._editFooter.bounceOutDown(this.ANIMATION_DURATION);
        this.refs._nameEdit.bounceOutLeft(this.ANIMATION_DURATION);
        this.refs._visibleSwitch.bounceOutRight(this.ANIMATION_DURATION);
        return this.refs._soundSwitch.bounceOutRight(this.ANIMATION_DURATION);
    }

    showNonEdit = () => {
        this.refs._nonEditFooter.bounceInUp(this.ANIMATION_DURATION);
        return this.refs._nameText.bounceInRight(this.ANIMATION_DURATION);
    }

    hideNonEdit = () => {
        this.refs._nonEditFooter.bounceOutDown(this.ANIMATION_DURATION);
        return this.refs._nameText.bounceOutRight(this.ANIMATION_DURATION);
    }

    onSubmit = () => {
        this.setState({
            submitting: true
        }, () => {
            API.graphql(graphqlOperation(mutations.updateUser, { 
                name: (this.state.username != this.state.user.name)? this.state.username: null,
                imgUri: this.state.imgUri
            })).then((data) => {
                var resp = data.data.updateUser;
                var user = resp.user;
                var errors = resp.errors;
                console.log("USER: ", JSON.stringify(user));
                if (errors != null) {
                    for (var error of errors) {
                        Toast.show(error);
                    }
                }
                this.setState({
                    user: user,
                    submitting: false
                });
                this.onCancelEdit();
            });
        });
    }

    renderHeaderForeground = () => {
        return (
            <TouchableHighlight 
            style={{flex: 1}}
            onPress={(this.state.editing)? this.onEditImage: null}
            activeOpacity={(this.state.editing)? 0.2: 0}
            underlayColor={'rgba(255, 255, 255, 0.2)'}>
                <View style={{flex: 1}} />
            </TouchableHighlight>
        );
    }

    renderHeaderBackground = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        return (
        <View 
        style={{flex: 1}}
        activeOpacity={(this.props.editing)? 1.0: 0.2}
        onPress={(this.state.editing)? this.onEditImage: null}>
            <CachedImage
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3,
                justifyContent: 'center',
                alignItems: 'center' }} 
            resizeMode={'cover'} 
            blurRadius={10}
            source={{uri: (this.state.imgUri)? this.state.imgUri: S3_URL + this.state.user.profilePicUrl + "-0.webp"}} />
            <CachedImage 
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3 }} 
            resizeMode={'contain'}
            source={{uri: (this.state.imgUri)? this.state.imgUri: S3_URL + this.state.user.profilePicUrl + "-3.webp"}} />
            {
                (this.state.editing)?
                (
                    <Animatable.Text 
                    animation="bounceInRight"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        width: "100%",
                        top: 130,
                        left: 0,
                        fontSize: 30,
                        color: 'black',
                        textAlign: 'center'
                    }}>
                        Press To Change
                    </Animatable.Text>
                ): null
            }
        </View>);
    }

    renderEditFooter = () => {
        var submitDisabled = !((this.state.username.length > 0 && this.state.username != this.state.user.name) || (this.state.imgUri != null));
        return (<Animatable.View 
            ref="_editFooter"
            style={{
                position: 'absolute',
                left: 0,
                bottom: -30,
                width: "100%",
                flexDirection: 'row', 
                justifyContent: 'space-evenly',
                paddingTop: 10,
                backgroundColor: Theme.PRIMARY_BACKGROUND,
                borderTopWidth: 3,
                borderColor: "#222222",
                paddingBottom: 40
            }}>
                <Button
                    title='CANCEL' 
                    disabled={this.state.submitting}
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onCancelEdit}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
                <Button
                    title='SUBMIT' 
                    loading={this.state.submitting} 
                    disabled={this.state.submitting || submitDisabled}
                    rounded={true} 
                    backgroundColor={'lime'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onSubmit}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
            </Animatable.View>);
    }

    renderNonEditFooter = () => {
        return (<Animatable.View 
            ref="_nonEditFooter"
            style={{
                position: 'absolute',
                left: 0,
                bottom: -30,
                width: "100%",
                flexDirection: 'row', 
                justifyContent: 'space-evenly',
                paddingTop: 10,
                backgroundColor: Theme.PRIMARY_BACKGROUND,
                borderTopWidth: 3,
                borderColor: "#222222",
                paddingBottom: 40
            }}>
                <Button
                    title='EDIT' 
                    rounded={true} 
                    backgroundColor={'blue'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onEdit}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
            </Animatable.View>);
    }

    isMe = () => {
        const { navigation } = this.props;
        return navigation.getParam('isMe');
    }

    isAuthenticated = () => {
        const { navigation } = this.props;
        return navigation.getParam('authenticated');
    }

    onReqAcceptPartyInvite = () => {
        API.graphql(graphqlOperation(mutations.acceptPartyInvite, { inviterID: this.state.user.id })).then((data) => {
            this.setState({
                isFriend: true,
                ownsPartyInvite: false,
                sentPartyInvite: false
            });
        });
    }

    onReqInviteToParty = () => {
        API.graphql(graphqlOperation(mutations.inviteToParty, { memberID: this.state.user.id })).then((data) => {
            var isFriend = data.data.inviteToParty;
            this.setState({
                isFriend: isFriend,
                sentPartyInvite: true
            })
        });
    }

    reqDeleteInvite = (isOwner, type) => {
        API.graphql(graphqlOperation(mutations.deleteInvite, { isOwner: isOwner, type: type, userID: this.state.user.id })).then((data) => {
            if (type == this.PARTY_INVITE_TYPE) {
                if (isOwner) {
                    this.setState({
                        sentPartyInvite: false
                    });
                } else {
                    this.setState({
                        ownsPartyInvite: false
                    });
                }
            } else {
                if (isOwner) {
                    this.setState({
                        sentFriendInvite: false
                    });
                } else {
                    this.setState({
                        ownsFriendInvite: false
                    });
                }
            }
        });
    }

    onReqDeletePartyInvite = () => {
        this.reqDeleteInvite(true, this.PARTY_INVITE_TYPE);
    }

    onReqDeclinePartyInvite = () => {
        this.reqDeleteInvite(false, this.PARTY_INVITE_TYPE);
    }

    onReqAddFriend = () => {
        API.graphql(graphqlOperation(mutations.addFriend, { friendID: this.state.user.id })).then((data) => {
            var isFriend = data.data.addFriend;
            this.setState({
                isFriend: isFriend,
                sentFriendInvite: !isFriend
            });
        });
    }

    onReqDeleteFriendInvite = () => {
        this.reqDeleteInvite(true, this.FRIEND_INVITE_TYPE);
    }

    onReqDeclineFriendInvite = () => {
        this.reqDeleteInvite(false, this.FRIEND_INVITE_TYPE);
    }

    onReqDeleteFriend = () => {
        API.graphql(graphqlOperation(mutations.removeFriend, { friendID: this.state.user.id })).then((data) => {
            this.setState({
                isFriend: false
            });
        });
    }

    renderSocial = () => {
        return (<View style={{
            width: "100%",
            flexDirection: 'column',
            alignContent: 'center'
        }}>
            {
                (!this.state.sentPartyInvite && !this.state.inParty)? (
                    <Button
                    title='INVITE TO PARTY' 
                    rounded={true} 
                    backgroundColor={'green'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqInviteToParty} />
                ): null
            }
            {
                (this.state.sentPartyInvite)? (
                    <Button
                    title='CANCEL PARTY INVITE' 
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqDeletePartyInvite} />
                ): null
            }
            {
                (this.state.ownsPartyInvite)? (
                    <Button
                    title='JOIN PARTY' 
                    rounded={true} 
                    backgroundColor={'blue'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqAcceptPartyInvite} />
                ): null
            }
            {
                (this.state.ownsPartyInvite)? (
                    <Button
                    title='DECLINE PARTY INVITE' 
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqDeclinePartyInvite} />
                ): null
            }
            {
                (!this.state.isFriend && !this.state.sentFriendInvite && !this.state.ownsFriendInvite && !this.state.ownsPartyInvite && !this.state.sentPartyInvite)? (
                    <Button
                    title='SEND FRIEND REQUEST' 
                    rounded={true} 
                    backgroundColor={'green'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqAddFriend} />
                ): null
            }
            {
                (!this.state.isFriend && this.state.sentFriendInvite && !this.state.ownsPartyInvite && !this.state.sentPartyInvite)? (
                    <Button
                    title='CANCEL FRIEND REQUEST' 
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqDeleteFriendInvite} />
                ): null
            }
            {
                (!this.state.isFriend && this.state.ownsFriendInvite && !this.state.ownsPartyInvite)? (
                    <Button
                    title='ACCEPT FRIEND REQUEST' 
                    rounded={true} 
                    backgroundColor={'green'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqAddFriend} />
                ): null
            }
            {
                (!this.state.isFriend && this.state.ownsFriendInvite && !this.state.ownsPartyInvite)? (
                    <Button
                    title='DECLINE FRIEND REQUEST' 
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqDeclineFriendInvite} />
                ): null
            }
            {
                (this.state.isFriend)? (
                    <Button
                    title='DELETE FRIEND' 
                    rounded={true} 
                    backgroundColor={'red'} 
                    containerViewStyle={{ marginTop: 20 }}
                    onPress={this.onReqDeleteFriend} />
                ): null
            }
        </View>);
    }

    renderOptionGrid = () => {
        var fontSize = 35;
        var subFontSize = 26;

        return (<View>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignContent: 'center',
                marginTop: 20,
                padding: 5,
                borderTopWidth: 2,
                borderColor: '#111111',
                backgroundColor: Theme.PRIMARY_BACKGROUND
            }}>
                <Text style={{
                    color: Theme.PRIMARY_FOREGROUND,
                    fontSize: subFontSize
                }}>
                    Profile is <Text style={{color: '#00FF7F'}}>Visible</Text>
                </Text>
                {
                    (this.state.editing)? (<Animatable.View
                        ref="_visibleSwitch"
                        style={{
                            justifyContent: 'center',
                            alignContent: 'center'
                        }}>
                            <Switch
                                disabled={!this.state.editing}
                                value={true} />
                        </Animatable.View>): null
                }
            </View>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignContent: 'center',
                padding: 5,
                borderTopWidth: 3,
                borderBottomWidth: 2,
                borderColor: '#111111',
                backgroundColor: Theme.PRIMARY_BACKGROUND
            }}>
                <Text style={{
                    color: Theme.PRIMARY_FOREGROUND,
                    fontSize: subFontSize
                }}>
                    Notifictions <Text style={{color: '#00FF7F'}}>Make Sound</Text>
                </Text>
                {
                    (this.state.editing)? (
                        <Animatable.View
                        ref="_soundSwitch" 
                        style={{
                            justifyContent: 'center',
                            alignContent: 'center'
                        }}>
                            <Switch
                                disabled={!this.state.editing}
                                value={true} />
                        </Animatable.View>
                    ): null
                }
            </View>
        </View>);
    }

    render() {
        var isMe = this.isMe();
        var footer = null;
        if (isMe && !this.state.passesExpanded) {
            footer = (this.state.editing)? this.renderEditFooter(): this.renderNonEditFooter();
        }
        var optionGrid = null;
        if (isMe) {
            optionGrid = this.renderOptionGrid();
        }
        var socialButtons = null;
        if (!isMe) {
            socialButtons = this.renderSocial();
        }
        var fontSize = 35;
        var subFontSize = 26;
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        var isAuthenticated = this.isAuthenticated();
        
        return (<View style={{
            width: "100%",
            height: "100%"
        }}>
            <PassParallax
            headerHeight={screenHeight * 0.3}
            renderHeaderForeground={this.renderHeaderForeground}
            renderHeaderBackground={this.renderHeaderBackground}
            editingEnabled={isMe}
            passes={this.state.passes}
            navigation={this.props.navigation}
            currentUserID={(isMe)? this.state.user.id: null}
            addPass={this.addPass}
            removePass={this.removePass}
            onExpand={(isMe)? this.onPassExpand: null}
            onContract={(isMe)? this.onPassContract: null}
            editHint={(this.state.editing)? "Press to Edit": null}
            error={this.state.passError}>
                <View style={{
                    width: "100%",
                    flexDirection: 'column',
                    alignContent: 'center',
                    marginTop: 20
                }}>
                    {
                        (!this.state.editing)? (
                            <Animatable.Text style={{
                                fontSize: fontSize,
                                color: Theme.PRIMARY_FOREGROUND,
                                textAlign: 'center'
                            }}
                            ref="_nameText" >
                                {this.state.user.name}
                            </Animatable.Text>):
                        (
                            <Animatable.View
                            ref="_nameEdit">
                                <FormInput 
                                inputStyle={{ color: Theme.PRIMARY_FOREGROUND }}
                                placeholderTextColor={ Theme.DISABLED_FOREGROUND }
                                placeholder={"Name"} 
                                value={this.state.username}
                                underlineColorAndroid={Theme.PRIMARY_FOREGROUND} 
                                blurOnSubmit={true} 
                                onChangeText={(value) => {this.setState({ "username": value })}} />
                            </Animatable.View>
                        )
                    }
                    { optionGrid }
                    { socialButtons }
                    {
                        (isMe && isAuthenticated)? (
                            <Button
                            title='SIGN OUT' 
                            rounded={true} 
                            backgroundColor={'red'} 
                            containerViewStyle={{ marginTop: 20 }}
                            onPress={this.onSignOut} />
                        ): null
                    }
                </View>
            </PassParallax>
            {footer}
            <Modal
            animationType="slide"
            visible={this.state.imagePickerOpen}
            onRequestClose={this.closeImagePicker}
            transparent={true}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    justifyContent: 'center',
                    alignContent: 'center'
                }}>
                    <View style={{
                        padding: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 2,
                        borderColor: 'black',
                        borderRadius: 5
                    }}>
                        <Button
                            title='CAMERA' 
                            icon={{name: 'camera-alt'}}
                            rounded={true} 
                            backgroundColor={'lime'} 
                            containerViewStyle={{ marginTop: 20 }}
                            onPress={this.onCameraPick}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                        <Button
                            title='GALLERY' 
                            icon={{name: 'photo-library'}}
                            rounded={true} 
                            backgroundColor={'blue'} 
                            containerViewStyle={{ marginTop: 20 }}
                            onPress={this.onGalleryPick}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                    </View>
                </View>
            </Modal>
        </View>);
    }
};
