import React from 'react';
import { StyleSheet, Text, View, TextInput, BackHandler } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button } from 'react-native-elements';
import Code from './Code';
import Fade from './utils/Fade';
import * as Animatable from 'react-native-animatable';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    }
});

export default class SignUp extends React.Component {
    static navigationOptions = {
        title: 'Sign Up'
    };

    constructor(props) {
        super();
        this.state = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            invalidEmailMessage: null,
            invalidPasswordMessage: null,
            signingUp: false,
            gettingCode: false
        };
    }

    componentWillMount() {
        
    }

    componentWillUnmount() {
        if (this.hasBackListener) {
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.visible) {
            if (!this.hasBackListener) {
                this.hasBackListener = true;
                BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
            }
        } else if (this.hasBackListener) {
            this.hasBackListener = false;
            BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
        }
    }

    handleBackPress = () => {
        if (this.state.gettingCode) {
            this.setState({
                gettingCode: false,
                signingUp: false
            });
            return true;
        }
        return false;
    }

    setEmail = (email) => {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        this.setState({
            "email": email,
            "invalidEmailMessage": (!re.test(String(email).toLowerCase()))? 'Invalid Email': null
        });
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

    onSignUpPressed = () => {
        this.openCode();
    }

    openCode = () => {
        var transitionLength = 500;
        this.refs._name.bounceOut(transitionLength);
        this.refs._email.bounceOutDown(transitionLength);
        this.refs._password.bounceOutUp(transitionLength);
        this.refs._confirmPassword.bounceOutLeft(transitionLength).then(() => {
            this.setState({
                gettingCode: true
            });
        });
    }

    render() {
        const { classes } = this.props;

        var signUpEnabled = (this.state.username.length > 0 && this.state.email.length >0 && this.state.invalidEmailMessage == null && this.state.password.length > 0 && this.state.invalidPasswordMessage == null && this.state.password == this.state.confirmPassword);
        var renderSignUp = (
            <View>
                <Animatable.View ref='_name' useNativeDriver>
                    <View>
                        <Fade visible={this.state.username.length >0}>
                            <FormLabel>Name</FormLabel>
                        </Fade>
                    </View>
                    <FormInput
                        ref='_nameInput' 
                        placeholder={"Name"} 
                        returnKeyType = {"next"} 
                        blurOnSubmit={false} 
                        value={this.state.username} 
                        underlineColorAndroid="#000000" 
                        onChangeText={(value) => {this.setState({ "username": value })}}
                        onSubmitEditing={() => { this.refs._emailInput.focus(); this.props.scrollTo(200); }} />
                </Animatable.View>
                <Animatable.View ref='_email' useNativeDriver>
                    <View>
                        <Fade visible={this.state.email.length > 0 && this.state.invalidEmailMessage == null}>
                            <FormLabel>Email</FormLabel>
                        </Fade>
                        <View style={{position: 'absolute', top: 0, left: 0}}>
                            <Fade visible={this.state.email.length > 0 && this.state.invalidEmailMessage != null}>
                                <FormLabel labelStyle={{ color: "red" }}>{this.state.invalidEmailMessage}</FormLabel>
                            </Fade>
                        </View>
                    </View>
                    <FormInput 
                        ref='_emailInput' 
                        placeholder={"Email"} returnKeyType = {"next"} 
                        keyboardType={"email-address"} 
                        blurOnSubmit={false} 
                        value={this.state.email} 
                        underlineColorAndroid={(this.state.email.length > 0 && this.state.invalidEmailMessage != null)? "#FF0000": "#000000"} 
                        onChangeText={this.setEmail}
                        onSubmitEditing={() => { this.refs._passwordInput.focus(); this.props.scrollTo(250); }} />
                </Animatable.View>
                <Animatable.View ref='_password' useNativeDriver>
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
                </Animatable.View>
                <Animatable.View ref='_confirmPassword' useNativeDriver>
                    <Fade visible={this.state.confirmPassword.length > 0 && this.state.password == this.state.confirmPassword}>
                        <FormLabel>Confirm Password</FormLabel>
                    </Fade>
                    <View style={{position: 'absolute', top: 0, left: 0}}>
                        <Fade visible={this.state.confirmPassword.length > 0 && this.state.password != this.state.confirmPassword}>
                            <FormLabel labelStyle={{ color: "red" }}>Passwords don't match</FormLabel>
                        </Fade>
                    </View>
                    <FormInput 
                        ref='_confirmPasswordInput'
                        placeholder={"Confirm Password"} 
                        blurOnSubmit={true} 
                        value={this.state.confirmPassword} 
                        secureTextEntry={true}
                        underlineColorAndroid={(this.state.confirmPassword.length > 0 && this.state.password != this.state.confirmPassword)? "#FF0000": "#000000"} 
                        onChangeText={(value) => {this.setState({ "confirmPassword": value })}} />
                    <Button
                        title={(!this.state.signingUp)? 'Sign Up': null} 
                        disabled={!signUpEnabled || this.state.signingUp} 
                        loading={this.state.signingUp} 
                        rounded={true} 
                        backgroundColor={'lime'} 
                        containerViewStyle={{ marginTop: 20 }}
                        onPress={this.onSignUpPressed} />
                </Animatable.View>
            </View>);
        return (!this.state.gettingCode)? renderSignUp: <Code />;
    }
};
