import React from 'react';
import { StyleSheet, Text, View, Image, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Collapsible from 'react-native-collapsible';
import Login from './Login';
import SignUp from './SignUp';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Animatable from 'react-native-animatable';
import AwsExports from '../../AwsExports';
import Amplify, { Auth } from 'aws-amplify';


Amplify.Logger.LOG_LEVEL = 'INFO';

Amplify.configure(AwsExports);

//Init to get profile and email
GoogleSignin.configure({
    webClientId: "484305592931-sm009q5ug5hhsn174uka9f2tmt17re8l.apps.googleusercontent.com"
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    optionButton: {
        zIndex: 100, 
        width: 100, 
        borderTopLeftRadius: 10, 
        borderTopRightRadius: 10, 
        backgroundColor: "rgba(240, 240, 240, 0.98)"
    }
});

export default class Authenticator extends React.Component {
    static navigationOptions = {
        title: 'Auth',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            username: '',
            password: '',
            page: 'google',
            googleSigningIn: false
        };
        this.scrollHeight = 0;
    }

    componentWillMount() {
        //this.silentSignIn();
    }

    silentSignIn() {
        var googleSilentSignIn = async() => {
            const userInfo = await GoogleSignin.signInSilently();
            var idToken = userInfo.idToken;
            await Auth.federatedSignIn(
                "accounts.google.com",
                { 
                    token: idToken
                }
            );
        }
        googleSilentSignIn().then(() => {
            this.onSignIn(true);
        }).catch((e) => {
            Auth.currentSession()
            .then(() => {
                this.onSignIn(true);
            }).catch((err) => {
                console.log("User is unauthenticated!");
                this.onSignIn(false);
            });
        });
    }

    //Fired when user presses Google Sign In Button
    onGooglePressed = async() => {
        console.log("YEEEEEEEEEEEEEET");
        try {
            await GoogleSignin.hasPlayServices();
            console.log("HERE HERE!");
            var userInfo = await GoogleSignin.signIn();
            console.log("USERINFO: ", JSON.stringify(userInfo));
            var idToken = userInfo.idToken;
            console.log("IDTOKEN: ", idToken);
            await Auth.federatedSignIn(
                "accounts.google.com",
                { 
                    token: idToken
                }
            );
            this.onSignIn(true);
        } catch (err) {
            console.error("OnGooglePress Error: ", err);
        }
    }

    //Sign in refers to any method of authentication
    onSignIn = (authenticated) => {
        console.log("On Sign In!");
    }

    //Change page to login, signup, or google
    navigateTo = (pageName) => {
        var transitionLength = 300;
        if (pageName != this.state.page) {
            if (pageName == 'login') {
                this._welcome.stopAnimation();
                this._welcomeBack.stopAnimation();
                this._welcome.bounceOutRight(transitionLength);
                this._welcomeBack.bounceInRight(transitionLength);
            } else if (this.state.page == 'login') {
                this._welcomeBack.stopAnimation();
                this._welcome.stopAnimation();
                this._welcomeBack.bounceOutRight(transitionLength);
                this._welcome.bounceInRight(transitionLength);
            }
            this.setState({
                "page": pageName
            });
        }
    }

    //Scrolls parallax image to specified height (0-300)
    scrollTo = (y) => {
        if (y > this.scrollHeight) {
            this.refs._scrollView.scrollTo({ y: y, animated: true });
        }
    }

    render() {
        return (
            <ParallaxScrollView
                ref='_scrollView'
                backgroundColor="blue"
                contentBackgroundColor="white"
                parallaxHeaderHeight={300}
                parallaxBackgroundScrollSpeed={30}
                stickyHeaderHeight={110}
                fadeOutForeground={false}
                onScroll={(event) => {
                    //update scroll height used in determining if scrolling on focus is necessary
                    this.scrollHeight = event.nativeEvent.contentOffset.y;
                }}
                renderBackground={() => (
                    <Image style={{"width": "100%", "height": 350}} source={require('../../assets/castle.jpg')}></Image>
                )}
                renderForeground={() => (
                    <View style={{width: "100%", height: 300}}>
                        { /* Header */ }
                        <View style={{ height: 300, flex: 1 }}>
                            <View style={{ width: "100%", height: 300, flex: 1 }}>
                                <Animatable.View animation="bounceInLeft" ref={component => {this._welcome = component}} style={{ width: "100%", height: 300, flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute' }} useNativeDriver>
                                    <Text style={{ fontSize: 30, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 5, padding: 5}}>Welcome</Text>
                                </Animatable.View>
                                <Animatable.View animation="bounceOutRight" ref={component => this._welcomeBack = component} style={{ width: "100%", height: 300, flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute' }} useNativeDriver>
                                    <Text style={{ fontSize: 30, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 5, padding: 5}}>Welcome Back</Text>
                                </Animatable.View>
                            </View>
                        </View>
                        { /* Tabs (Login, Sign Up, Google) */ }
                        <View style={{ flex: 1, flexDirection: 'row', width: "100%", justifyContent: 'center',
                            alignItems: 'center', position: 'absolute', bottom: -4 }}>
                            { 
                                (this.state.page != 'sign up')? 
                                    <Button color="black" buttonStyle={styles.optionButton} title='Sign Up' onPress={this.navigateTo.bind(this, 'sign up')}></Button>: null
                            }
                            { 
                                (this.state.page != 'login')? 
                                    <Button color="black" buttonStyle={styles.optionButton} title='Login' onPress={this.navigateTo.bind(this, 'login')}></Button>: null
                            }
                            {
                                (this.state.page != 'google')?
                                    <Button color="black" buttonStyle={styles.optionButton} title='Google' onPress={this.onGooglePressed} />: null
                            }
                        </View>
                    </View>
                )}>
                    { /* Body contains one of three pages */ }
                    <View style={{zIndex: 0, marginTop: 15, paddingTop: 20, width: "100%"}}>
                        <Collapsible collapsed={this.state.page != 'login'}>
                            <Login 
                                visible={this.state.page == 'login'}
                                scrollTo={this.scrollTo} 
                                onSignIn={this.onSignIn} />
                        </Collapsible>
                        <Collapsible collapsed={this.state.page != 'sign up'}>
                            <SignUp 
                                visible={this.state.page == 'sign up'}
                                scrollTo={this.scrollTo} 
                                onSignIn={this.onSignIn} />
                        </Collapsible>
                        <Collapsible collapsed={this.state.page != 'google'}>
                            <View style={{ height: 300, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <GoogleSigninButton
                                    style={{ width: 230, height: 48 }}
                                    size={GoogleSigninButton.Size.Standard}
                                    color={GoogleSigninButton.Color.Dark}
                                    onPress={this.onGooglePressed}
                                    disabled={this.state.googleSigningIn} />
                            </View>
                        </Collapsible>
                    </View>
                </ParallaxScrollView>
        );
    }
};
