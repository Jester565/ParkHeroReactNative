import React from 'react';
import { View, Text, NetInfo, ConnectionType, AsyncStorage } from 'react-native';
import AwsExports from '../AwsExports';
import Rides from './ride/Rides';
import Home from './home/Home';
import { IndicatorViewPager, PagerTabIndicator } from 'rn-viewpager';
import Amplify, { Auth, Hub, API, graphqlOperation } from 'aws-amplify';
import * as mutations from '../src/graphql/mutations';
import moment from 'moment';
import { GoogleSignin } from 'react-native-google-signin';
import Party from './party/Party';
import NetManager from '../NetManager';

Amplify.configure(AwsExports);

export default class Main extends React.Component {
    static navigationOptions = {
        title: 'Main',
        header: null
    };

    constructor(props) {
        super();

        this.state = {
            signedIn: false,
            isPagingEnabled: true
        };
    }

    componentWillMount() {
        AsyncStorage.getItem('signIn').then((signInInfoStr) => {
            var signInInfo = JSON.parse(signInInfoStr);
            var user = signInInfo.user;
            var authenticated = signInInfo.authenticated;
            if (this.user == null) {
                this.setState({
                    signedIn: true,
                    user: user,
                    authenticated: authenticated
                });
            }
        }).catch((ex) => {
            console.log("No saved user");
        });
        this.netSubToken = NetManager.subscribe(this.onNetEvent);
    }

    componentWillUnmount() {
        NetManager.unsubscribe(this.netSubToken);
    }

    onNetEvent = (type, payload) => {
        if (type == "netSignIn") {
            this.user = payload.user;
            this.setState({
                signedIn: true,
                user: payload.user,
                authenticated: payload.authenticated
            });
        }
    }

    setPagingEnabled = (enabled) => {
        console.log("IS PAGING ENABLED: ", enabled);
        this.setState({
            isPagingEnabled: enabled
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
                    style={{backgroundColor: '#222222', height: (this.state.isPagingEnabled)? 50: 0}}
                    tabs={tabs} 
                    iconStyle={{ width: 30, height: 30 }} 
                    selectedIconStyle={{ width: 30, height: 30 }}  />
                }
                initialPage={1}
                horizontalScroll={this.state.isPagingEnabled}
                scrollEnabled={this.state.isPagingEnabled}>
                <View style={{height: "100%", width: "100%"}}>
                {
                    (this.state.signedIn)?
                    (
                        <Party 
                            navigation={this.props.navigation}
                            user={this.state.user}
                            authenticated={this.state.authenticated}
                            setPagingEnabled={this.setPagingEnabled} />
                    ): null
                }
                </View>
                <View style={{height: "100%", width: "100%"}}>
                    {
                        (this.state.signedIn)?
                        (
                            <Home
                                user={this.state.user}
                                authenticated={this.state.authenticated}
                                navigation={this.props.navigation} />
                        ): null
                    }
                </View>
                <View style={{height: "100%", width: "100%"}}>
                    {
                        (this.state.signedIn)?
                        (
                            <Rides 
                                navigation={this.props.navigation}
                                currentUserID={(this.state.user != null)? this.state.user.id: null}
                                authenticated={this.state.authenticated} />
                        ): null
                    }
                </View>
            </IndicatorViewPager>
        );
    }
};
