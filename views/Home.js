import React from 'react';
import { View, Text } from 'react-native';
import AwsExports from '../AwsExports';
import Rides from './ride/Rides';
import Authenticator from './auth/Authenticator';
import Amplify, { Auth } from 'aws-amplify';
import { ViewPager, IndicatorViewPager, PagerTabIndicator } from 'rn-viewpager';
import { Hub, API, graphqlOperation } from 'aws-amplify';
var PushNotification = require('react-native-push-notification');
import {AsyncStorage} from 'react-native';
import * as mutations from '../src/graphql/mutations';

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
            endpointUserID: null,
            subscriptionArn: null })).then((data) => {
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
        
        var msg = notification.default;
        if (msg != null) {
            Hub.dispatch(msg.type, msg.payload, 'Notification');

            console.log("CREATING LOCAL NOTIFICATION");
            PushNotification.localNotification({
                title: "Watch Update",
                message: "Tiny Chungus",
                soundName: "entrywhistle.mp3",
            });
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

export default class Home extends React.Component {
    static navigationOptions = {
        title: 'Home',
        header: null
    };

    constructor(props) {
        super();

        this.state = {
            signedIn: false
        };
    }

    onSignIn = (authenticated, user) => {
        User = user;
        if (SnsToken != null) {
            RegisterSns(SnsToken, User);
        }
        this.setState({ signedIn: true });
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
                    <Authenticator 
                        onSignIn={this.onSignIn}
                        onNotification={this.onNotification} />
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
