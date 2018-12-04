import React from 'react';
import { StyleSheet, Image, TextInput, BackHandler } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import { createAnimatableComponent, View } from 'react-native-animatable';
import Fade from '../utils/Fade';
import Code from './Code';
import AwsExports from '../../AwsExports';
import Amplify, { Auth } from 'aws-amplify';

Amplify.configure(AwsExports);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    }
});

const theme = {
    Button: {
      titleStyle: {
        color: 'red',
      },
    },
  };

export default class ForgotPassword extends React.Component {
    static navigationOptions = {
        title: 'Code',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            username: props.username,
            submitting: false,
            showCode: false
        };
    }

    componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }

    handleBackPress = () => {
        if (this.props.visible) {
            if (this.state.showCode) {
                this.setState({
                    showCode: false
                });
                return true;
            }
        }
        return false;
    }

    onSubmit = async() => {
        this.setState({
            submitting: true
        });
        try {
            await Auth.forgotPassword(this.state.username);
            this.setState({
                showCode: true
            });
        } catch (err) {
            console.error("ForgotPassword Err: ", err);
        }
        this.setState({
            submitting: false
        });
    }

    render() {
        const { classes } = this.props;
        var renderForgotPassword = (
            <View>
                <View animation="bounceIn" iterationCount={1} duration={1500} style={{ justifyContent:'center', alignItems: 'center', width: "100%", height: 110 }} useNativeDriver>
                    { /* Question isn't an icon name, but an icon not found shows a question mark */ }
                    <Text h1>?</Text>
                </View>
                <View animation="bounceInLeft" iterationCount={1} duration={1500} style={{ width: "100%", height: 100, flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30}} useNativeDriver>
                    <Text h4>Forget Something</Text>
                </View>
                <View>
                    <Fade visible={this.state.username.length > 0} duration={100}>
                        <FormLabel>Username</FormLabel>
                    </Fade>
                </View>
                <View animation="bounceInRight" iterationCount={1} duration={1500} useNativeDriver>
                    <FormInput 
                        placeholder={"Username"} 
                        value={this.state.username}
                        underlineColorAndroid="#000000" 
                        onChangeText={(value) => {this.setState({ username: value })}} />
                </View>
                <View animation="bounceInUp" iterationCount={1} duration={1500} useNativeDriver>
                    <Button
                        title='Submit' 
                        loading={this.state.submitting} 
                        disabled={!(this.state.username.length > 0) || this.state.submitting}
                        rounded={true} 
                        backgroundColor={'lime'} 
                        containerViewStyle={{ marginTop: 20 }} 
                        onPress={this.onSubmit} />
                </View>
            </View>);
         return (!this.state.showCode)? renderForgotPassword: 
            <Code 
                config={{ mode: 'FORGOTPWD', username: this.state.username }} 
                scrollTo={this.props.scrollTo}
                onSignIn={this.props.onSignIn} />;
    }
};
