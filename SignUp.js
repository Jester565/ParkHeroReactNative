import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button } from 'react-native-elements';
import Fade from './utils/Fade';

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
            invalidPasswordMessage: null
        };
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

    render() {
        const { classes } = this.props;
        return (
            <View>
                <View>
                    <Fade visible={this.state.username.length >0}>
                        <FormLabel>Name</FormLabel>
                    </Fade>
                </View>
                <FormInput placeholder={"Name"} value={this.state.username} underlineColorAndroid="#000000" onChangeText={(value) => {this.setState({ "username": value })}} />
                <View>
                    <Fade visible={this.state.email.length > 0 && this.state.invalidEmailMessage == null}>
                        <FormLabel>Email</FormLabel>
                    </Fade>
                    <View style={{position: 'absolute', top: 0, left: 0}}>
                        <Fade visible={this.state.email.length > 0 && this.state.invalidEmailMessage != null}>
                            <FormLabel>{this.state.invalidEmailMessage}</FormLabel>
                        </Fade>
                    </View>
                </View>
                <FormInput placeholder={"Email"} value={this.state.email} underlineColorAndroid="#000000" onChangeText={this.setEmail} />
                <View>
                    <Fade visible={this.state.password.length > 0 && this.state.invalidPasswordMessage == null}>
                        <FormLabel>Password</FormLabel>
                    </Fade>
                    <View style={{position: 'absolute', top: 0, left: 0}}>
                        <Fade visible={this.state.password.length > 0 && this.state.invalidPasswordMessage != null}>
                            <FormLabel>{this.state.invalidPasswordMessage}</FormLabel>
                        </Fade>
                    </View>
                </View>
                <FormInput placeholder={"Password"} value={this.state.password} underlineColorAndroid="#000000" onChangeText={this.setPassword} secureTextEntry={true} />
                <View>
                    <Fade visible={this.state.confirmPassword.length > 0 && this.state.password == this.state.confirmPassword}>
                        <FormLabel>Confirm Password</FormLabel>
                    </Fade>
                    <View style={{position: 'absolute', top: 0, left: 0}}>
                        <Fade visible={this.state.confirmPassword.length > 0 && this.state.password != this.state.confirmPassword}>
                            <FormLabel>Passwords don't match</FormLabel>
                        </Fade>
                    </View>
                </View>
                <FormInput placeholder={"Confirm Password"} value={this.state.confirmPassword} underlineColorAndroid="#000000" onChangeText={(value) => {this.setState({ "confirmPassword": value })}} secureTextEntry={true} />
                <Button
                    title='Sign Up' />
            </View>);
    }
};
