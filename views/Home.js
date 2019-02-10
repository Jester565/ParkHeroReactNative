import React from 'react';
import { View, Text } from 'react-native';
import AwsExports from '../AwsExports';
import Rides from './ride/Rides';
import Authenticator from './auth/Authenticator';
import Amplify, { Auth } from 'aws-amplify';
import { ViewPager, IndicatorViewPager, PagerTabIndicator } from 'rn-viewpager';

Amplify.configure(AwsExports);

export default class Home extends React.Component {
    static navigationOptions = {
        title: 'Home',
        header: null
    };

    constructor(props) {
        super();

        this.state = {
            signedIn: false
        }
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
                    <Authenticator onSignIn={() => { this.setState({ signedIn: true }); }} />
                </View>
                <View style={{height: "100%", width: "100%"}}>
                    {
                        (this.state.signedIn)?
                        (
                            <Rides />
                        ): null
                    }
                </View>
            </IndicatorViewPager>
        );
    }
};
