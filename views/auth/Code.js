import React from 'react';
import { StyleSheet, Image, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import { createAnimatableComponent, View } from 'react-native-animatable';
import Fade from '../utils/Fade';
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

export default class Code extends React.Component {
    static navigationOptions = {
        title: 'Code',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            code: '',
            password: '',
            confirmPassword: '',
            invalidPasswordMessage: null,
            submitting: false
        };
    }

    onSubmitPressed = async() => {
        this.setState({
            submitting: true
        });
        var pwd = (this.props.config.password != null)? this.props.config.password : this.state.password;

        if (this.props.config.mode == "SIGNUP") {
            try {
                await Auth.confirmSignUp(this.props.config.username, this.state.code);
                await Auth.signIn(this.props.config.username, pwd);
                this.props.onSignIn(true);
            } catch (err) {
                console.error("Code SignUpErr: ", err);       
            }
            this.setState({ submitting: false });
        } 
        //ENTERING CODE TO RESET PASSWORD
        else if (this.props.config.mode == "FORGOTPWD") {
            try {
                await Auth.forgotPasswordSubmit(this.props.config.username, this.state.code, pwd)
                var user = await Auth.signIn(this.props.config.username, pwd)
                this.props.onSignIn(true);
            } catch (err) {
                console.error("ForgotPwdErr SubmitErr: ", err);
            }
            this.setState({ submitting: false });
        }
    }

    onResendPressed = async() => {
        if (this.props.config.mode == "SIGNUP") {
            this.setState({ submitting: true });
            try {
                await Auth.resendSignUp(this.props.config.username);
            } catch (err) {
                console.error("CodeSignUp ResendErr: ", err);
            }
            this.setState({ submitting: false });
        } else if (this.props.config.mode == "FORGOTPWD") {
            try {
                await Auth.forgotPassword(this.props.config.username);
            } catch (err) {
                console.error("CodeForgotPassword ResendErr: ", err);
            }
            this.setState({ submitting: false });
        }
    }

    setPassword = (password) => {
        var pwdMessage = null;
        if (password.length < 8) {
            pwdMessage = "Password must be 8 characters long";
        } else if (!(/\d/.test(password))) {
            pwdMessage = "Password must have 1 number";
        } else if ((/^[a-z0-9]+$/i.test(password))) {
            pwdMessage = "Password must have one symbol";
        }
        this.setState({
            "password": password,
            "invalidPasswordMessage": pwdMessage
        });
    }

    render() {
        const { classes } = this.props;
        return (
                <View>
                    <View animation="bounceIn" iterationCount={1} duration={1500} style={{ justifyContent:'center', alignItems: 'center', width: "100%", height: 110 }} useNativeDriver>
                        <Icon
                            name='email'
                            size={100}
                            color='#000000' />
                    </View>
                    <View animation="bounceInLeft" iterationCount={1} duration={1500} style={{ width: "100%", height: 100, flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30}} useNativeDriver>
                        <Text h4>Check Your Email</Text>
                    </View>
                    <View>
                        <Fade visible={this.state.code.length > 0} duration={100}>
                            <FormLabel>Code</FormLabel>
                        </Fade>
                    </View>
                    <View animation="bounceInRight" iterationCount={1} duration={1500} useNativeDriver>
                        <FormInput 
                            placeholder={"Code"} 
                            value={this.state.code}
                            returnKeyType = {(this.props.config.password == null)? "next": "done"} 
                            blurOnSubmit={false} 
                            underlineColorAndroid="#000000" 
                            onChangeText={(value) => {this.setState({ code: value })}}
                            onSubmitEditing={() => { 
                                if (this.props.config.password == null) {
                                    this.refs._passwordInput.focus(); this.props.scrollTo(250);
                                }
                            }} />
                    </View>
                    {
                        //Create a new password for forgot password flow
                        (this.props.config.password == null)? (
                        <View>
                            <View ref='_password' useNativeDriver>
                                <View>
                                    <Fade visible={this.state.password.length > 0 && this.state.invalidPasswordMessage == null}>
                                        <FormLabel>Password</FormLabel>
                                    </Fade>
                                    <View style={{position: 'absolute', top: 0, left: 0}}>
                                        <Fade visible={this.state.password.length > 0 && this.state.invalidPasswordMessage != null}>
                                            <FormLabel labelStyle={{ color: "red" }}>{this.state.invalidPasswordMessage}</FormLabel>
                                        </Fade>
                                    </View>
                                </View>
                                <View animation="bounceInRight" iterationCount={1} duration={1500} useNativeDriver>
                                    <FormInput 
                                        ref='_passwordInput'
                                        placeholder={"Password"} 
                                        returnKeyType = {"next"} 
                                        blurOnSubmit={false} 
                                        value={this.state.password} 
                                        secureTextEntry={true}
                                        underlineColorAndroid={(this.state.password.length > 0 && this.state.invalidPasswordMessage != null)? "#FF0000": "#000000"} 
                                        onChangeText={this.setPassword} 
                                        onSubmitEditing={() => { this.refs._confirmPasswordInput.focus(); this.props.scrollTo(300); }} />
                                </View>
                            </View>
                            <View ref='_confirmPassword' useNativeDriver>
                                <Fade visible={this.state.confirmPassword.length > 0 && this.state.password == this.state.confirmPassword}>
                                    <FormLabel>Confirm Password</FormLabel>
                                </Fade>
                                <View style={{position: 'absolute', top: 0, left: 0}}>
                                    <Fade visible={this.state.confirmPassword.length > 0 && this.state.password != this.state.confirmPassword}>
                                        <FormLabel labelStyle={{ color: "red" }}>Passwords don't match</FormLabel>
                                    </Fade>
                                </View>
                                <View animation="bounceInRight" iterationCount={1} duration={1500} useNativeDriver>
                                    <FormInput 
                                        ref='_confirmPasswordInput'
                                        placeholder={"Confirm Password"} 
                                        blurOnSubmit={true} 
                                        value={this.state.confirmPassword} 
                                        secureTextEntry={true}
                                        underlineColorAndroid={(this.state.confirmPassword.length > 0 && this.state.password != this.state.confirmPassword)? "#FF0000": "#000000"} 
                                        onChangeText={(value) => {this.setState({ "confirmPassword": value })}} />
                                </View>
                            </View>
                        </View>): null
                    }
                    
                    <View animation="bounceInUp" iterationCount={1} duration={1500} useNativeDriver>
                        <Button
                            title='Submit' 
                            loading={this.state.submitting} 
                            disabled={!(this.state.code.length > 0 && 
                                (this.props.config.password != null || 
                                    (this.state.password.length >= 8 && this.state.invalidPasswordMessage == null && this.state.password == this.state.confirmPassword)))
                                || this.state.submitting}
                            rounded={true} 
                            backgroundColor={'lime'} 
                            containerViewStyle={{ marginTop: 20 }} 
                            onPress={this.onSubmitPressed} />
                    </View>

                    <View animation="bounceInUp" iterationCount={1} duration={1500} useNativeDriver>
                        <Button
                            title='Resend' 
                            loading={this.state.submitting} 
                            disabled={this.state.submitting}
                            rounded={true} 
                            backgroundColor={'blue'} 
                            containerViewStyle={{ marginTop: 20 }} 
                            onPress={this.onResendPressed} />
                    </View>
                </View>
            );
    }
};
