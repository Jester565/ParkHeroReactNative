import React from 'react';
import { View, Text } from 'react-native';
import AwsExports from '../AwsExports';
import Rides from './ride/Rides';
import Home from './home/Home';
import { ViewPager, IndicatorViewPager, PagerTabIndicator } from 'rn-viewpager';
import Amplify, { Auth, Hub, API, graphqlOperation } from 'aws-amplify';
var PushNotification = require('react-native-push-notification');
import {AsyncStorage} from 'react-native';
import * as mutations from '../src/graphql/mutations';
import moment from 'moment';
import { GoogleSignin } from 'react-native-google-signin';

Amplify.configure(AwsExports);

//Init to get profile and email
GoogleSignin.configure({
    webClientId: "484305592931-sm009q5ug5hhsn174uka9f2tmt17re8l.apps.googleusercontent.com"
});

Amplify.configure(AwsExports);

var User = null;
var SnsToken = null;

function RegisterSns(token, user) {
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
            subscriptionArn: subscriptionArn })).then((data) => {
                AsyncStorage.setItem("endpointUserID", user.id);
                AsyncStorage.setItem("endpointArn", data.data.verifySns.endpointArn);
                AsyncStorage.setItem("subscriptionArn", data.data.verifySns.subscriptionArn);
        });
    });
}

PushNotification.configure({
    onError: (err) => {
        console.log("PUSH ERROR: ", err);
    },

    onRegister: (token) => {
        console.log("ON REGISTER: ", token);
        SnsToken = token.token;
        if (User != null) {
            RegisterSns(SnsToken, User);
        }
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
                                var msg = "";
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

                console.log("CREATING LOCAL NOTIFICATION: " + msg);
                PushNotification.localNotification({
                    title: "Ride Update",
                    message: msg,
                    soundName: soundName
                });
            }
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

    /**
      * (optional) default: true
      * - Specified if permissions (ios) and token (android and ios) will requested or not,
      * - if not, you must call PushNotificationsHandler.requestPermissions() later
      */
    requestPermissions: true,
});

export default class Main extends React.Component {
    static navigationOptions = {
        title: 'Main',
        header: null
    };

    constructor(props) {
        super();

        this.state = {
            signedIn: false
        };

        this.silentSignIn();
    }

    silentSignIn() {
                var googleSilentSignIn = async() => {
            const userInfo = await GoogleSignin.signInSilently();
                        var idToken = userInfo.idToken;
            await Auth.federatedSignIn(
                "accounts.google.com",
                { 
                    token: idToken
                }
            );
        }
        googleSilentSignIn().then(() => {
            console.log("GOOGLE SIGN IN");
            this.onSignIn(true);
        }).catch((e) => {
            Auth.currentSession()
            .then(() => {
                console.log("REUSE SIGN IN");
                this.onSignIn(true);
            }).catch((err) => {
                console.log("User is unauthenticated!");
                this.onSignIn(false);
            });
        });
    }

    onSignIn = (authenticated, username) => {
        API.graphql(graphqlOperation(mutations.createUser, { name: username })).then((data) => {
                        var user = data.data.createUser;
            User = user;
            if (SnsToken != null) {
                RegisterSns(SnsToken, User);
            }
            this.setState({ 
                signedIn: true,
                authenticated: authenticated
            });
        });
    }

    signOut = () => {
                var onGoogleSignOut = () => {
            Auth.signOut()
            .then(data => {
                this.silentSignIn();
            }).catch(err => console.log(err));
        }
        GoogleSignin.isSignedIn().then((signedIn) => {
            if (signedIn) {
                GoogleSignin.revokeAccess().then(() => {
                    GoogleSignin.signOut().then(() => {
                        onGoogleSignOut();
                    })
                });
            } else {
                onGoogleSignOut();
            }
        });
    }

    onNotification = (notification) => {
                var msg = notification.default;
        Hub.dispatch(msg.type, msg.payload, 'Notification');

        PushNotification.localNotification({
            bigText: "Big Chungus"
        });
    }

    render() {
                var tabs = [{
            iconSource: require('../assets/partys.png'),
            selectedIconSource: require('../assets/party.png')
        },
        {
            iconSource: require('../assets/homes.png'),
            selectedIconSource: require('../assets/home.png')
        },
        {
            iconSource: require('../assets/ride2s.png'),
            selectedIconSource: require('../assets/ride2.png')
        }]
        return (
            <IndicatorViewPager style={{ width: "100%", height: "100%" }} indicator={
                <PagerTabIndicator 
                    style={{backgroundColor: '#222222', height: 50}}
                    tabs={tabs} 
                    iconStyle={{ width: 30, height: 30 }} 
                    selectedIconStyle={{ width: 30, height: 30 }}  />
                }>
                <View style={{height: "100%", width: "100%"}}>
                    <Text>Party</Text>
                </View>
                <View style={{height: "100%", width: "100%"}}>
                    {
                        (this.state.signedIn)?
                        (
                            <Home
                                user={User}
                                authenticated={this.state.authenticated}
                                onSignIn={this.onSignIn}
                                signOut={this.signOut}
                                navigation={this.props.navigation} />
                        ): null
                    }
                </View>
                <View style={{height: "100%", width: "100%"}}>
                    {
                        (this.state.signedIn)?
                        (
                            <Rides navigation={this.props.navigation} />
                        ): null
                    }
                </View>
            </IndicatorViewPager>
        );
    }
};