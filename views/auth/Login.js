import React from 'react';
import { StyleSheet, Text, View, Image, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Fade from '../utils/Fade';

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
            loggingIn: false
        };
    }

    render() {
        const { classes } = this.props;
        return (
                <View>
                    <View>
                        <Fade visible={this.state.username.length > 0} duration={100}>
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
                    <View>
                        <Fade visible={this.state.password.length > 0} duration={100}>
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
                    <Button
                        title='Login' 
                        loading={this.state.loggingIn} 
                        disabled={!(this.state.username.length > 0 && this.state.password.length >= 8) || this.state.loggingIn}
                        rounded={true} 
                        backgroundColor={'lime'} 
                        containerViewStyle={{ marginTop: 20 }} />
                </View>
            );
    }
};
