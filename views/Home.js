import React from 'react';
import { View } from 'react-native';
import AwsExports from '../AwsExports';
import Rides from './ride/Rides';
import Authenticator from './auth/Authenticator';
import Amplify, { Auth } from 'aws-amplify';
import { ViewPager } from 'rn-viewpager';

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
        return (
            <ViewPager style={{height: "100%", width: "100%"}}>
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
            </ViewPager>
        );
    }
};
