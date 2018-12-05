import React from 'react';
import { StyleSheet, Text, View, Image, TextInput, BackHandler } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Fade from '../utils/Fade';
import * as Animatable from 'react-native-animatable';
import ForgotPassword from './ForgotPassword';
import AwsExports from '../../AwsExports';
import Code from './Code';
import Toast from 'react-native-root-toast';
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

export default class Login extends React.Component {
    static navigationOptions = {
        title: 'Login',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            username: '',
            password: '',
            loggingIn: false,
            showForgotPassword: false,
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
            if (this.state.showForgotPassword) {
                this.setState({
                    showForgotPassword: false
                });
                return true;
            }
        }
        return false;
    }

    onLoginPressed = async() => {
        this.setState({
            loggingIn: true
        });
        try {
            var user = await Auth.signIn(this.state.username, this.state.password);
            this.props.onSignIn();
        } catch (err) {
            console.log("LOGIN ERROR: ", JSON.stringify(err));
            if (err.code == "UserNotConfirmedException") {
                this.openCode();
            } else {
                Toast.show(err.message);
                this.refs._login.shake(1000);
                this.setState({
                    loggingIn: false
                });
            }
        }
    }

    bounceOut = () => {
        var bounceOutDuration = 500;
        this.refs._name.bounceOutUp(bounceOutDuration);
        this.refs._password.bounceOutLeft(bounceOutDuration);
        this.refs._login.bounceOutRight(bounceOutDuration);
        return this.refs._forgotPassword.bounceOutDown(bounceOutDuration);
    }

    openCode = () => {
        this.bounceOut().then(() => {
            this.setState({ 
                showCode: true,
                loggingIn: false
            });
        });
    }

    onForgotPasswordPressed = () => {
        this.bounceOut().then(() => {
            this.setState({ 
                showForgotPassword: true
            });
        });
    }

    render() {
        var renderLogin = (
            <View>
                <Animatable.View ref="_name">
                    <View>
                        <Fade visible={this.state.username.length > 0}>
                            <FormLabel>Name</FormLabel>
                        </Fade>
                    </View>
                    <FormInput 
                        placeholder={"Name"} 
                        value={this.state.username}
                        underlineColorAndroid="#000000" 
                        returnKeyType = {"next"} 
                        blurOnSubmit={false} 
                        onChangeText={(value) => {this.setState({ "username": value })}}
                        onSubmitEditing={() => { this.refs._passwordInput.focus(); this.props.scrollTo(200); }} />
                </Animatable.View>
                <Animatable.View ref="_password">
                    <View>
                        <Fade visible={this.state.password.length > 0}>
                            <FormLabel>Password</FormLabel>
                        </Fade>
                    </View>
                    <FormInput 
                        ref='_passwordInput' 
                        placeholder={"Password"} 
                        value={this.state.password} 
                        underlineColorAndroid="#000000" 
                        secureTextEntry={true}
                        onChangeText={(value) => {this.setState({ "password": value })}} />
                </Animatable.View>
                <Animatable.View ref="_login">
                    <Button
                        title='Login' 
                        loading={this.state.loggingIn} 
                        disabled={!(this.state.username.length > 0 && this.state.password.length >= 8) || this.state.loggingIn}
                        rounded={true} 
                        backgroundColor={'lime'} 
                        containerViewStyle={{ marginTop: 20 }}
                        onPress={this.onLoginPressed} />
                </Animatable.View>
                <Animatable.View ref="_forgotPassword">
                    <Button
                        title='Forgot Password?' 
                        disabled={this.state.loggingIn}
                        rounded={true} 
                        backgroundColor={'blue'} 
                        containerViewStyle={{ marginTop: 20 }}
                        onPress={this.onForgotPasswordPressed} />
                </Animatable.View>
            </View>
        );
        if (this.state.showCode) {
            return <Code 
                config={{ mode: 'SIGNUP', username: this.state.username, password: this.state.password }} 
                scrollTo={this.props.scrollTo}
                onSignIn={this.props.onSignIn} />
        } else if (this.state.showForgotPassword) {
            return <ForgotPassword  
                username={this.state.username}
                visible={this.props.visible}
                scrollTo={this.props.scrollTo}
                onSignIn={this.props.onSignIn} />
        } else {
            return renderLogin;
        }
    }
};
