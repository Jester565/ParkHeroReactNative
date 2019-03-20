import {AsyncStorage, NetInfo, AppState} from 'react-native';
import { GoogleSignin } from 'react-native-google-signin';
import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import * as mutations from './src/graphql/mutations';
var PushNotification = require('react-native-push-notification');
import AwsExports from './AwsExports';

Amplify.configure(AwsExports);

GoogleSignin.configure({
    webClientId: "484305592931-sm009q5ug5hhsn174uka9f2tmt17re8l.apps.googleusercontent.com"
});

var _snsToken = null;
var _expireTime = null;

PushNotification.configure({
    onError: (err) => {
        console.log("PUSH ERROR: ", err);
    },

    onRegister: (token) => {
        console.log("ON REGISTER: ", token);
        _snsToken = token.token;
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: (notification) => {
        console.log("NOTIFICATION: ", JSON.stringify(notification));
        //Don't continue on local notifications
        
        if (notification.default != null) {
            var data = JSON.parse(notification.default);
            console.log("DATA: ", JSON.stringify(data, null ,2));
            var soundName = "entrywhistle.mp3";
            if (data != null) {                
                Hub.dispatch(data.type, data.payload, 'Notification');
                var payload = data.payload;
                var title = null;
                var msg = "";
                if (data.type == 'watchUpdate') {
                    title = "Ride Update";
                    for (var update of payload.updates) {
                        if (update.rideID == "353303") {
                            soundName = "incredi.mp3";
                        } else if (update.rideID == "16514416") {
                            soundName = "cars.mp3";
                        }
                        if (msg.length > 0) {
                            msg += "\n";
                        }
                                            var fieldSet = false;
                        msg += update.rideName;
                        if (update.waitMins != null) {
                            msg += "'s wait is " + update.waitMins.updated.toString() + " mins";
                            fieldSet = true;
                        } else if (update.waitRating != null && update.waitMins == null) {
                            msg += (fieldSet? ", ": "'s ") + "wait is " + update.waitRating.updated.toString() + " mins";
                            fieldSet = true;
                        } else if (update.fastPassTime != null) {
                            msg += (fieldSet? ", ": "'s ") + "FastPass is at " + moment(update.fastPassTime.updated, "YYYY-MM-DD HH:mm:ss").format("h:mm A")
                            fieldSet = true;
                        } else if (update.closedMins != null) {
                            msg += (fieldSet? ", ": " ") + "opened after " + update.closedMins.toString()
                        }
                    }
                } else if (data.type == "addFriend") {
                    if (payload.isFriend) {
                        title = "Friend Added";
                        msg += payload.user.name + " is now a friend";
                    } else {
                        title = "Friend Invite";
                        msg += payload.user.name + " sent you a friend request";
                    }
                } else if (data.type == "inviteToParty") {
                    title = "Invited to Party";
                    msg += payload.user.name + " sent you a party invite";
                } else if (data.type == "acceptPartyInvite") {
                    title = "New Party Member";
                    msg += payload.user.name + " joined the party";
                }
                if (title != null) {
                    console.log("CREATING LOCAL NOTIFICATION: " + msg);
                    PushNotification.localNotification({
                        title: title,
                        message: msg,
                        soundName: soundName,
                        data: data
                    });
                }
            }
        } else if (notification.data) {
            // Reroute to notification
        }
    },

    // ANDROID ONLY: GCM or FCM Sender ID (product_number) (optional - not required for local notifications, but is need to receive remote push notifications)
    senderID: "484305592931",

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
        alert: true,
        badge: true,
        sound: true
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: false,

    requestPermissions: true,
});

var _user = null;
var _authenticated = false;
var _refreshTimeout = null;

var _subCount = 0;

var _appState = null;

var _subscriptions = {};

function _registerSns(token, user) {
    var getPromises = [
        AsyncStorage.getItem("endpointUserID"),
        AsyncStorage.getItem("endpointArn"),
        AsyncStorage.getItem("subscriptionArn")
    ];
    Promise.all(getPromises).then((values) => {
        var endpointUserID = values[0];
        var endpointArn = values[1];
        var subscriptionArn = values[2];
        API.graphql(graphqlOperation(mutations.verifySns, { 
            token: token, 
            endpointArn: endpointArn,
            endpointUserID: endpointUserID,
            subscriptionArn: subscriptionArn 
        })).then((data) => {
            AsyncStorage.setItem("endpointUserID", user.id);
            AsyncStorage.setItem("endpointArn", data.data.verifySns.endpointArn);
            AsyncStorage.setItem("subscriptionArn", data.data.verifySns.subscriptionArn);
        });
    });
}

function subscribe(subscription) {
    _subCount++;
    _subscriptions[_subCount] = subscription;
    if (_user != null) {
        subscription('netSignIn', { user: _user, authenticated: _authenticated });
    }
    return _subCount;
}

function unsubscribe(subKey) {
    if (subKey != null) {
        delete _subscriptions[subKey];
    }
}

function _refreshLogin() {
    NetInfo.isConnected.removeEventListener(
        'connectionChange',
        _handleConnectivityChange
    );
    console.log("REFRESH LOGIN INVOKE");
    silentSignIn();
}

function _handleConnectivityChange(isConnected) {
    console.log("CONNECTION CHANGE: ", isConnected);
    if (isConnected) {
        NetInfo.isConnected.removeEventListener(
            'connectionChange',
            _handleConnectivityChange
        );
        silentSignIn();
    }
}

function _handleAppStateChange(nextAppState) {
    if (nextAppState == 'active' && (_appState == 'background' || _appState == 'inactive')) {
        NetInfo.isConnected.fetch().then(isConnected => {
            if (isConnected) {
                console.log("APP STATE INVOKE");
                silentSignIn();
            } else {
                NetInfo.isConnected.addEventListener(
                    'connectionChange',
                    _handleConnectivityChange
                );
            }
        });
    } else if ((nextAppState == 'background' || nextAppState == 'inactive') && _appState == 'active') {
        NetInfo.isConnected.removeEventListener(
            'connectionChange',
            _handleConnectivityChange
        );
        clearTimeout(this._refreshTimeout);
    }
    _appState = nextAppState;
}

/*
    Rules:
        If connected & sign in successful: send subscription success
        If connected & sign in fail: send subscribers a failure
        If disconnected: Wait for network to go online
    Features:
        Automatically refreshes expired tokens
    Issues:
        May send signIn events to subscribers too often
*/

function init() {
    NetInfo.isConnected.fetch().then(isConnected => {
        if (isConnected) {
            console.log("INITIAL IS CONNECTED INVOKE");
            silentSignIn();
        } else {
            NetInfo.isConnected.addEventListener(
                'connectionChange',
                _handleConnectivityChange
            );
        }
    });

    AppState.addEventListener('change', _handleAppStateChange);
}

function silentSignIn() {
    console.log("IN SILENT SIGN IN");
    if (_refreshTimeout != null) {
        clearTimeout(_refreshTimeout);
        _refreshTimeout = null;
    }

    var googleSilentSignIn = async() => {
        const userInfo = await GoogleSignin.signInSilently();
        var idToken = userInfo.idToken;
        var fedSignInResult = await Auth.federatedSignIn(
            "accounts.google.com",
            { 
                token: idToken
            }
        );
        return fedSignInResult;
    }

    var refreshCredentials = async() => {
        var authenticated = null;
        var expiration = null;
        try {
            await googleSilentSignIn();
            authenticated = true;
        } catch (e) {
            try {
                await Auth.currentSession();
                authenticated = true;
            } catch (e) { 
                authenticated = false;
            }
        }
        return {
            authenticated: authenticated,
            expiration: expiration
        };
    }
    
    refreshCredentials().then(async (refreshInfo) => {
        console.log("CREDS REFERESHED: ", JSON.stringify(refreshInfo));
        var authenticated = refreshInfo.authenticated;
        var expireTime = refreshInfo.expiration;

        try {
            try {
                signInInfo = JSON.parse(await AsyncStorage.getItem('signIn'));
                _user = signInInfo.user;
                _authenticated = signInInfo.authenticated;
            } catch (ex) {}
            if (_user == null || (_authenticated !== authenticated && authenticated !== null)) {
                _authenticated = authenticated;
                var createUserData = await API.graphql(graphqlOperation(mutations.createUser, { name: null }));
                _user = createUserData.data.createUser;
                if (_snsToken != null) {
                    _registerSns(_snsToken, _user);
                }
                AsyncStorage.setItem('signIn', JSON.stringify({
                    user: _user,
                    authenticated: _authenticated
                }));
            }
            for (var subKey in _subscriptions) {
                _subscriptions[subKey]("netSignIn", { user: _user, authenticated: _authenticated });
            }
            //Get expiration time of credentials for new logins
            if (expireTime == null) {
                var currentCreds = await Auth.currentCredentials();
                if (currentCreds != null && !currentCreds.expired) {
                    expireTime = currentCreds.expireTime;
                }
            }
            if (expireTime != null) {
                console.log("LOGIN REFRESH: ", expireTime - Date.now());
                _expireTime = expireTime;
                _refreshTimeout = setTimeout(_refreshLogin, expireTime - Date.now());
            }
        } catch (ex) { 
            for (var subKey in _subscriptions) {
                _subscriptions[subKey]("signInFail", ex);
            }
        }

        NetInfo.isConnected.addEventListener(
            'connectionChange',
            _handleConnectivityChange
        );
    });
}

function signIn(authenticated, username) {
    if (_refreshTimeout != null) {
        clearTimeout(_refreshTimeout);
        _refreshTimeout = null;
    }
    return new Promise((resolve, reject) => {
        _authenticated = authenticated;
        API.graphql(graphqlOperation(mutations.createUser, { name: username })).then(async (data) => {
            _user = data.data.createUser;
            if (_snsToken != null) {
                _registerSns(_snsToken, _user);
            }
            AsyncStorage.setItem('signIn', JSON.stringify({
                user: _user,
                authenticated: _authenticated
            }));
            for (var subKey in _subscriptions) {
                _subscriptions[subKey]("netSignIn", { user: _user, authenticated: _authenticated });
            }
            
            var currentCreds = await Auth.currentCredentials();
            if (currentCreds != null && !currentCreds.expired) {
                var expireTime = currentCreds.expireTime;
                _expireTime = expireTime;
                _refreshTimeout = setTimeout(_refreshLogin, expireTime - Date.now());
            }
            resolve();
        }).catch((ex) => {
            for (var subKey in _subscriptions) {
                _subscriptions[subKey]("signInFail", ex);
            }
            reject(ex);
        });
    });
}

function signOut() {
    console.log("ON SIGN OUT");
    var onGoogleSignOut = () => {
        console.log("ON GOOGLE SIGN OUT");
        Auth.signOut()
        .then(data => {
            console.log("CALLING SUB KEYS");
            for (var subKey in _subscriptions) {
                _subscriptions[subKey]("netSignOut");
            }
            _user = null;
            _authenticated = null;
            silentSignIn();
        }).catch(err => console.log(err));
    }
    GoogleSignin.isSignedIn().then((signedIn) => {
        console.log("GOOLGE SIGN IN: ", signedIn);
        if (signedIn) {
            GoogleSignin.revokeAccess().then(() => {
                console.log("REVOKED");
                GoogleSignin.signOut().then(() => {
                    console.log("SIGNED OUT");
                    onGoogleSignOut();
                })
            });
        } else {
            onGoogleSignOut();
        }
    });
}

var NetManager = {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    init: init,
    silentSignIn: silentSignIn,
    signIn: signIn,
    signOut: signOut
};

export default NetManager;