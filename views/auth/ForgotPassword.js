import React from 'react';
import { StyleSheet, Image, TextInput, BackHandler, View } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Code from './Code';
import Toast from 'react-native-root-toast';
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

    bounceOut = () => {
        var bounceOutDuration = 500;
        this.refs._question.bounceOutUp(bounceOutDuration);
        this.refs._header.bounceOutLeft(bounceOutDuration);
        this.refs._name.bounceOutRight(bounceOutDuration);
        return this.refs._submit.bounceOutDown(bounceOutDuration);
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
            await this.bounceOut();
            this.setState({
                showCode: true
            });
        } catch (err) {
            if (err.code == "UserNotFoundException") {
                Toast.show('User does not exist');
            }
            this.refs._submit.shake(1000);
            console.log("ForgotPassword Err: ", err);
        }
        this.setState({
            submitting: false
        });
    }

    render() {
        const { classes } = this.props;

        var bounceInDuration = 1500;
        var renderForgotPassword = (
            <View>
                <Animatable.View ref="_question" animation="bounceIn" iterationCount={1} duration={bounceInDuration} style={{ justifyContent:'center', alignItems: 'center', width: "100%", height: 110 }} useNativeDriver>
                    { /* Question isn't an icon name, but an icon not found shows a question mark */ }
                    <Text h1>?</Text>
                </Animatable.View>
                <Animatable.View ref="_header" animation="bounceInLeft" iterationCount={1} duration={bounceInDuration} style={{ width: "100%", height: 100, flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30}} useNativeDriver>
                    <Text h4>Forget Something</Text>
                </Animatable.View>
                <Animatable.View ref="_name" animation="bounceInRight" iterationCount={1} duration={bounceInDuration} useNativeDriver>
                    <View>
                        <Fade visible={this.state.username.length > 0}>
                            <FormLabel>Username</FormLabel>
                        </Fade>
                    </View>
                    <View>
                        <FormInput 
                            placeholder={"Username"} 
                            value={this.state.username}
                            underlineColorAndroid="#000000" 
                            onChangeText={(value) => {this.setState({ username: value })}} />
                    </View>
                </Animatable.View>
                <Animatable.View ref="_submit" animation="bounceInUp" iterationCount={1} duration={bounceInDuration} useNativeDriver>
                    <Button
                        title='Submit' 
                        loading={this.state.submitting} 
                        disabled={!(this.state.username.length > 0) || this.state.submitting}
                        rounded={true} 
                        backgroundColor={'lime'} 
                        containerViewStyle={{ marginTop: 20 }} 
                        onPress={this.onSubmit} />
                </Animatable.View>
            </View>);
         return (!this.state.showCode)? renderForgotPassword: 
            <Code 
                config={{ mode: 'FORGOTPWD', username: this.state.username }} 
                scrollTo={this.props.scrollTo}
                onSignIn={this.props.onSignIn} />;
    }
};
