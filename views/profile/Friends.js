import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight, Text, Modal, FlatList } from 'react-native';
import { Icon, Button, FormInput, Divider } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import AwsExports from '../../AwsExports';
import PassParallax from '../pass/PassParallax';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import Amplify, { API, graphqlOperation, Hub } from 'aws-amplify';
import { Switch, ScrollView } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';
import Toast from 'react-native-root-toast';
import UserSearch from './UserSearch';
import UserRow from './UserRow';
import { isEquals } from 'immutability-helper';
import InviteRow from './InviteRow';
import Commons from '../../Commons';
import NetManager from '../../NetManager';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Friends extends React.Component {
    static navigationOptions = {
        title: 'Friends',
        header: null
    };

    constructor(props) {
        super(props);
        this.FRIEND_INVITE_TYPE = 0;
        this.PARTY_INVITE_TYPE = 1;
        this.ANIMATION_DURATION = 500;

        const { navigation } = props;
        this.currentUser = navigation.getParam('currentUser');
        this.state = {
            searchUsers: [],
            friends: [],
            partyMembers: [],
            selectedUsers: {},
            userQuery: '',
            selecting: false,
            selectedUserArr: [],
            friendInvites: [],
            partyInvites: []
        };
    }

    componentWillMount = () => {
        Hub.listen('addFriend', this, 'Friends-AddFriend');
        Hub.listen('removeFriend', this, 'Friends-RemoveFriend');
        Hub.listen('inviteToParty', this, 'Friends-InviteToParty');
        Hub.listen('leaveParty', this, 'Friends-LeaveParty');
        Hub.listen('acceptPartyInvite', this, 'Friends-AcceptPartyInvite');
        Hub.listen('deleteInvite', this, 'Friends-DeleteInvite');

        this.netSubToken = NetManager.subscribe(this.handleNet);
    }

    refreshAll = () => {
        this.refreshFriends();
        this.refreshPartyMembers();
        this.refreshInvites();
    }

    handleNet = (event) => {
        if (event == "netSignIn") {
            this.refreshAll();
            this.focusListener = this.props.navigation.addListener('willFocus', () => {
                this.refreshAll();
            });
        }
    }

    componentWillUnmount() {
        if (this.focusListener != null) {
            this.focusListener.remove();
        }
        if (this.netSubToken != null) {
            NetManager.unsubscribe(this.netSubToken);
        }
    }

    // Default handler for listening events
    onHubCapsule(capsule) {
        console.log("HUB INVOKED");
        const { channel, payload } = capsule;
        if (channel === 'addFriend') { 
            if (payload.isFriend) {
                this.onFriendAdded(payload.user);
            } else { 
                this.onFriendInviteAdded(payload.user); 
            }
        } else if (channel == 'removeFriend') {
            this.onFriendRemoved(payload.userID);
        } else if (channel == 'inviteToParty') {
            this.onInvitedToParty(payload.user);
        } else if (channel == 'leaveParty') {
            this.onLeaveParty(payload.userID);
        } else if (channel == 'acceptPartyInvite') {
            this.onPartyInviteAccepted(payload.user);
        } else if (channel == 'deleteInvite') {
            this.onInviteDeleted(payload.userID, payload.isOwner, payload.type);
        }
    }

    onPress = (user) => {
        if (this.state.selecting) {
            this.onSelectChange(user);
        } else {
            this.onOpen(user);
        }
    }

    onLongPress = (user) => {
        this.onSelect(user);
    }

    hasSelectedFriends = () => {
        return this.usersInUserIDs(this.state.friends, this.state.selectedUsers) > 0;
    }

    hasSelectedPartyMembers = () => {
        return this.usersInUserIDs(this.state.partyMembers, this.state.selectedUsers) > 0;
    }

    hasSelectedNonFriends = () => {
        var selectCount = Object.keys(this.state.selectedUsers).length;
        return this.usersInUserIDs(this.state.friends, this.state.selectedUsers) < selectCount;
    }

    hasSelectedNonPartyMembers = () => {
        var selectCount = Object.keys(this.state.selectedUsers).length;
        return this.usersInUserIDs(this.state.partyMembers, this.state.selectedUsers) < selectCount;
    }

    usersInUserIDs = (users, userIDs) => {
        var count = 0;
        for (var userID in userIDs) {
            for (var user of users) {
                if (user.id == userID) {
                    count++;
                }
            }
        }
        return count;
    }

    onSelectChange = (user) => {
        if (this.state.selectedUsers[user.id]) {
            this.onUnselect(user);
        } else {
            this.onSelect(user);
        }
    }

    updateUserSelect = (userArr, userID, selected) => {
        var matchI = -1;
        userArr.forEach((user, i) => {
            if (user.id == userID && user.selected != selected) {
                matchI = i;
            }
        });
        if (matchI >= 0) {
            var newArr = userArr.slice();
            newArr[matchI].selected = selected;
            return newArr;
        }
        return null;
    }

    onSelect = (user) => {
        if (!this.state.selectedUsers[user.id]) {
            var selectedUsers = Object.assign({}, this.state.selectedUsers);
            selectedUsers[user.id] = user;
            var selectedUserArr = this.state.selectedUserArr.slice();
            user.selected = true;
            selectedUserArr.push(user);
            var newState = {
                selectedUsers: selectedUsers,
                selectedUserArr: selectedUserArr,
                selecting: true
            };
            var friendArr = this.updateUserSelect(this.state.partyMembers, user.id, true);
            if (friendArr != null) {
                newState.friends = friendArr;
            }
            var partyMemberArr = this.updateUserSelect(this.state.partyMembers, user.id, true);
            if (partyMemberArr != null) {
                newState.partyMembers = partyMemberArr;
            }
            this.setState(newState);
        }
    }

    onUnselect = (user) => {
        if (this.state.selectedUsers[user.id]) {
            var selectedUsers = Object.assign({}, this.state.selectedUsers);
            delete selectedUsers[user.id];
            var selectedUserArr = [];
            for (var selUser of this.state.selectedUserArr) {
                if (selUser.id != user.id) {
                    selectedUserArr.push(selUser);
                }
            }
            var newState = {
                selectedUsers: selectedUsers,
                selectedUserArr: selectedUserArr,
                selecting: (Object.keys(selectedUsers).length > 0)
            };
            var friendArr = this.updateUserSelect(this.state.partyMembers, user.id, false);
            if (friendArr != null) {
                newState.friends = friendArr;
            }
            var partyMemberArr = this.updateUserSelect(this.state.partyMembers, user.id, false);
            if (partyMemberArr != null) {
                newState.partyMembers = partyMemberArr;
            }
            this.setState(newState);
        }
    }

    onCancelSelect = () => {
        this.setState({
            selectedUsers: {},
            selectedUserArr: [],
            selecting: false
        });
    }

    onOpen = (user) => {
        this.props.navigation.navigate('Profile', {
            isMe: (this.currentUser.id == user.id),
            user: user
        });
    }

    refreshFriends = () => {
        API.graphql(graphqlOperation(queries.getFriends)).then((data) => {
            var friends = data.data.getFriends;
            this.setState({
                friends: friends
            });
        });
    }

    refreshPartyMembers = () => {
        API.graphql(graphqlOperation(queries.getPartyMembers)).then((data) => {
            var partyMembers = data.data.getPartyMembers;
            var filteredPartyMembers = [];
            for (var partyMember of partyMembers) {
                if (partyMember.id != this.currentUser.id) {
                    filteredPartyMembers.push(partyMember);
                }
            }
            this.setState({
                partyMembers: filteredPartyMembers
            });
        });
    }

    refreshInvites = () => {
        API.graphql(graphqlOperation(queries.getInvites)).then((data) => {
            var invites = data.data.getInvites;
            
            var friendInvites = [];
            var partyInvites = [];
            for (var invite of invites) {
                if (invite.type == this.FRIEND_INVITE_TYPE) {
                    friendInvites.push(invite);
                } else {
                    partyInvites.push(invite);
                }
            }
            this.setState({
                friendInvites: friendInvites,
                partyInvites: partyInvites
            });
        });
    }

    isFriendInviteEqual = (e1, e2) => {
        return (this.isUserEqual(e1.user, e2.user));
    }

    isPartyInviteEqual = (e1, e2) => {
        return (this.isUserEqual(e1.user, e2.user) && e1.isOwner == e2.isOwner);
    }

    isUserEqual = (e1, e2) => {
        return (e1.id == e2.id);
    }

    
    onFriendInviteAdded = (user) => {
        var friendInvites = Commons.addToArr(this.state.friendInvites, {
            user: user,
            isOwner: false
        }, this.isFriendInviteEqual);
        this.setState({
            friendInvites: friendInvites
        });
    }
    
    onFriendAdded = (user) => {
        var friends = Commons.addToArr(this.state.friends, user, this.isUserEqual);
        var friendInvites = Commons.removeFromArr(this.state.friendInvites, { user: user }, this.isFriendInviteEqual);
        this.setState({
            friends: friends,
            friendInvites: friendInvites
        });
    }

    onFriendRemoved = (userID) => {
        var friends = Commons.removeFromArr(this.state.friends, { id: userID }, this.isUserEqual);
        this.setState({
            friends: friends
        });
    }

    onInvitedToParty = (user) => {
        var partyInvites = Commons.addToArr(this.state.partyInvites, {
            user: user,
            isOwner: false
        }, this.isPartyInviteEqual);
        this.setState({
            partyInvites: partyInvites
        });
    }

    onLeaveParty = (userID) => {
        var partyMembers = Commons.removeFromArr(this.state.partyMembers, {
            id: userID
        }, this.isUserEqual);
        this.setState({
            partyMembers: partyMembers
        });
    }

    onPartyInviteAccepted = (user) => {
        var partyInvites = Commons.removeFromArr(this.state.partyInvites, {
            user: user,
            isOwner: true
        }, this.isPartyInviteEqual);
        partyInvites = Commons.removeFromArr(partyInvites, {
            user: user,
            isOwner: false
        }, this.isPartyInviteEqual);
        var partyMembers = Commons.addToArr(this.state.partyMembers, user, this.isUserEqual);
        this.setState({
            partyInvites: partyInvites,
            partyMembers: partyMembers
        });
    }

    onInviteDeleted = (userID, isOwner, type) => {
        if (type == this.FRIEND_INVITE_TYPE) {
            var friendInvites = Commons.removeFromArr(this.state.friendInvites, {
                user: { id: userID },
                isOwner: isOwner
            }, this.isFriendInviteEqual);
            this.setState({
                friendInvites: friendInvites
            });
        } else {
            var partyInvites = Commons.removeFromArr(this.state.partyInvites, {
                user: { id: userID },
                isOwner: isOwner
            }, this.isPartyInviteEqual);
            this.setState({
                partyInvites: partyInvites
            });
        }
    }

    reqAddFriend = (user) => {
        API.graphql(graphqlOperation(mutations.addFriend, { friendID: user.id })).then((data) => {
            var friends = this.state.friends;
            var friendInvites = this.state.friendInvites;
            var isFriend = data.data.addFriend;
            if (isFriend) {
                friends = Commons.addToArr(this.state.friends, user, this.isUserEqual);
                friendInvites = Commons.removeFromArr(this.state.friendInvites, {
                    isOwner: false,
                    user: user
                }, this.isFriendInviteEqual);
            } else {
                var invite = {
                    isOwner: true,
                    isFriend: false,
                    type: this.FRIEND_INVITE_TYPE,
                    user: user
                };
                friendInvites = Commons.addToArr(this.state.friendInvites, invite, this.isFriendInviteEqual);
            }
            this.setState({
                friends: friends,
                friendInvites: friendInvites
            })
        });
    }

    onReqAddFriends = () => {
        this.state.selectedUserArr.forEach((user) => {
            this.reqAddFriend(user);
        });
        this.onCancelSelect();
    }

    onReqRemoveFriends = () => {
        this.state.selectedUserArr.forEach((user) => {
            API.graphql(graphqlOperation(mutations.removeFriend, { friendID: user.id })).then((data) => {
                var friends = Commons.removeFromArr(this.state.friends, user, this.isUserEqual);
                this.setState({
                    friends: friends
                });
            });
        });
        this.onCancelSelect();
    }

    onReqAddPartyMembers = () => {
        this.state.selectedUserArr.forEach((user) => {
            API.graphql(graphqlOperation(mutations.inviteToParty, { memberID: user.id })).then((data) => {
                var isFriend = data.data.inviteToParty;
                var invite = {
                    isOwner: true,
                    isFriend: isFriend,
                    type: this.PARTY_INVITE_TYPE,
                    user: user
                };
                var partyInvites = Commons.addToArr(this.state.partyInvites, invite, this.isPartyInviteEqual);
                this.setState({
                    partyInvites: partyInvites
                });
            });
        });
        this.onCancelSelect();
    }

    onReqFriendAccept = (invite) => {
        this.reqAddFriend(invite);
    }

    onReqFriendDecline = (invite) => {
        this.reqDeleteInvite(invite, this.FRIEND_INVITE_TYPE).then(() => {
            var friendInvites = Commons.removeFromArr(this.state.friendInvites, {
                isOwner: invite.isOwner,
                type: this.FRIEND_INVITE_TYPE,
                user: invite
            }, this.isFriendInviteEqual);
            this.setState({
                friendInvites: friendInvites
            });
        });
    }

    onReqPartyAccept = (invite) => {
        var inviteUser = {
            id: invite.id,
            name: invite.name,
            profilePicUrl: invite.profilePicUrl
        };
        API.graphql(graphqlOperation(mutations.acceptPartyInvite, { inviterID: invite.id })).then((data) => {
            var partyMembers = data.data.acceptPartyInvite;
            var partyInvites = Commons.removeFromArr(this.state.partyInvites, {
                user: inviteUser,
                isOwner: invite.isOwner
            }, this.isPartyInviteEqual);
            var friends = Commons.addToArr(this.state.friends, inviteUser, this.isUserEqual);
            var friendInvites = Commons.removeFromArr(this.state.friendInvites, {
                user: inviteUser,
                isOwner: invite.isOwner
            }, this.isFriendInviteEqual);
            var filteredPartyMembers = [];
            for (var partyMember of partyMembers) {
                if (partyMember.id != this.currentUser.id) {
                    filteredPartyMembers.push(partyMember);
                }
            }
            
            this.setState({
                partyMembers: filteredPartyMembers,
                friends: friends,
                partyInvites: partyInvites,
                friendInvites: friendInvites
            });
        });
    }

    onReqPartyDecline = (invite) => {
        this.reqDeleteInvite(invite, this.PARTY_INVITE_TYPE).then(() => {
            var partyInvites = Commons.removeFromArr(this.state.partyInvites, {
                user: invite,
                isOwner: invite.isOwner
            }, this.isPartyInviteEqual);
            this.setState({
                partyInvites: partyInvites
            });
        });
    }

    reqDeleteInvite = (invite, type) => {
        return API.graphql(graphqlOperation(mutations.deleteInvite, { isOwner: invite.isOwner, type: type, userID: invite.id }));
    }

    renderSelectFooter = () => {
        var selectedFriends = this.hasSelectedFriends();
        var selectedPartyMembers = this.hasSelectedPartyMembers();
        var selectedNonFriends = this.hasSelectedNonFriends();
        var selectedNonPartyMembers = this.hasSelectedNonPartyMembers();

        var friendButton = <View />;
        
        //Selected just friends
        if (selectedFriends && !selectedNonFriends) {
            friendButton = (<Button
            title='REMOVE FRIEND' 
            loading={this.state.submitting} 
            disabled={this.state.submitting}
            rounded={true} 
            backgroundColor={'red'} 
            containerViewStyle={{ flex: 1 }}
            titleStyle={{ textAlign: 'center' }}
            onPress={this.onReqRemoveFriends}
            fontSize={16}
            disabledStyle={{
                backgroundColor: Theme.DISABLED_BACKGROUND
            }}
            disabledTextStyle={{
                color: Theme.DISABLED_FOREGROUND
            }} />);
        } else if (!selectedFriends && selectedNonFriends) {
            friendButton = (<Button
            title='ADD FRIEND' 
            loading={this.state.submitting} 
            disabled={this.state.submitting}
            rounded={true} 
            backgroundColor={'lime'} 
            containerViewStyle={{ flex: 1 }}
            titleStyle={{ textAlign: 'center' }}
            onPress={this.onReqAddFriends}
            fontSize={16}
            disabledStyle={{
                backgroundColor: Theme.DISABLED_BACKGROUND
            }}
            disabledTextStyle={{
                color: Theme.DISABLED_FOREGROUND
            }} />);
        }

        var partyButton = <View />;

        if (!selectedPartyMembers && selectedNonPartyMembers) {
            partyButton = (<Button
                title='ADD TO PARTY' 
                loading={this.state.submitting} 
                disabled={this.state.submitting}
                rounded={true} 
                backgroundColor={'lime'} 
                containerViewStyle={{ flex: 1 }}
                titleStyle={{ textAlign: 'center' }}
                onPress={this.onReqAddPartyMembers}
                fontSize={16}
                disabledStyle={{
                    backgroundColor: Theme.DISABLED_BACKGROUND
                }}
                disabledTextStyle={{
                    color: Theme.DISABLED_FOREGROUND
                }} />);
        }
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
                {friendButton}
                
                <Button
                title='CANCEL' 
                disabled={this.state.submitting}
                rounded={true} 
                backgroundColor={'blue'} 
                containerViewStyle={{ flex: 1 }}
                titleStyle={{ textAlign: 'center' }}
                onPress={this.onCancelSelect}
                fontSize={16}
                disabledStyle={{
                    backgroundColor: Theme.DISABLED_BACKGROUND
                }}
                disabledTextStyle={{
                    color: Theme.DISABLED_FOREGROUND
                }} />

                {partyButton}
            </Animatable.View>);
    }

    renderUser = (user) => {
        return <UserRow 
            key={user.id}
            id={user.id}
            profilePicUrl={user.profilePicUrl}
            name={user.name}
            selected={user.selected}
            onPress={this.onPress}
            onLongPress={this.onLongPress} />
    }

    renderFriendInvite = (invite) => {
        return <InviteRow 
            key={invite.user.id}
            id={invite.user.id}
            profilePicUrl={invite.user.profilePicUrl}
            name={invite.user.name}
            isOwner={invite.isOwner}
            onPress={this.onPress}
            onAccept={this.onReqFriendAccept}
            onDecline={this.onReqFriendDecline} />
    }

    renderPartyInvite = (invite) => {
        return <InviteRow 
            key={invite.user.id}
            id={invite.user.id}
            profilePicUrl={invite.user.profilePicUrl}
            name={invite.user.name}
            isOwner={invite.isOwner}
            onPress={this.onPress}
            onAccept={this.onReqPartyAccept}
            onDecline={this.onReqPartyDecline} />
    }

    render() {
        var fontSize = 35;
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        var selectingNonFriends = this.hasSelectedNonFriends();
        var selectingNonPartyMembers = this.hasSelectedNonPartyMembers();

        return (<View style={{
            width: "100%",
            height: "100%",
        }}>
            <UserSearch 
                selectedUsers={this.state.selectedUsers}
                onPress={this.onPress}
                onLongPress={this.onLongPress} />
            <ScrollView>
                {
                    (this.state.selecting && selectingNonFriends && selectingNonPartyMembers)? (
                        <View>
                            <Text style={{
                                fontSize: 30,
                                textAlign: 'center',
                                color: Theme.PRIMARY_FOREGROUND
                            }}>SELECTED</Text>
                            <FlatList
                            keyExtractor={(item, index) => {
                                return item.id + "--" + item.selected;
                            }}
                            data={this.state.selectedUserArr}
                            renderItem={({item}) => this.renderUser(item)} />
                            <Divider style={{ backgroundColor: 'blue', marginTop: 15, marginBottom: 15 }} />
                        </View>
                    ): null
                }
                <Text style={{
                    fontSize: 30,
                    textAlign: 'center',
                    color: Theme.PRIMARY_FOREGROUND
                }}>FRIEND</Text>
                {
                    (this.state.friends.length > 0)?
                    (<FlatList
                        keyExtractor={(item, index) => {
                            return item.id + "--" + item.selected;
                        }}
                        data={this.state.friends}
                        renderItem={({item}) => this.renderUser(item)} />)
                    :(
                        <Text style={{
                            textAlign: 'center',
                            color: Theme.PRIMARY_FOREGROUND
                        }}>Add friends with the search bar to see their blackout dates and easily add them to a party</Text>
                    )
                }
                {
                    (this.state.friendInvites.length > 0)?
                    (<View>
                        <Text style={{
                            marginTop: 10,
                            fontSize: 20,
                            textAlign: 'center',
                            color: Theme.PRIMARY_FOREGROUND
                        }}>FRIEND INVITES</Text>
                        <FlatList
                        keyExtractor={(item, index) => {
                            return item.user.id + "--" + item.isOwner;
                        }}
                        data={this.state.friendInvites}
                        renderItem={({item}) => this.renderFriendInvite(item)} />
                    </View>)
                    : null
                }
                <Divider style={{ backgroundColor: 'blue', marginTop: 15, marginBottom: 15 }} />
                <Text style={{
                    fontSize: 30,
                    textAlign: 'center',
                    color: Theme.PRIMARY_FOREGROUND
                }}>PARTY</Text>
                {
                    (this.state.partyMembers.length > 0)?
                    (<FlatList
                        keyExtractor={(item, index) => {
                            return item.id + "--" + item.selected;
                        }}
                        data={this.state.partyMembers}
                        renderItem={({item}) => this.renderUser(item)} />)
                    :(
                        <Text style={{
                            textAlign: 'center',
                            color: Theme.PRIMARY_FOREGROUND
                        }}>Party members are automatically added as friends and temporarily share passes, fastpasses, and photos</Text>
                    )
                }
                {
                    (this.state.partyInvites.length > 0)?
                    (<View>
                        <Text style={{
                            fontSize: 20,
                            textAlign: 'center',
                            color: Theme.PRIMARY_FOREGROUND
                        }}>PARTY INVITES</Text>
                        <FlatList
                        keyExtractor={(item, index) => {
                            return item.user.id + "--" + item.isOwner;
                        }}
                        data={this.state.partyInvites}
                        renderItem={({item}) => this.renderPartyInvite(item)} />
                    </View>)
                    : null
                }
                <View style={{
                    height: 100
                }} />
            </ScrollView>
            {
                (this.state.selecting)? (
                    this.renderSelectFooter()
                ): null
            }
        </View>);
    }
};
