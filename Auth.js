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

export default class Auth extends React.Component {
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

    scrollTo = (y) => {
        if (y > this.scrollHeight) {
            this.refs._scrollView.scrollTo({ y: y, animated: true });
        }
    }

    onGooglePressed = () => {

    }

    render() {
        var googleButton = <Button color="black" buttonStyle={styles.optionButton} title='Google' onClick={this.onGooglePressed} />
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
                    this.scrollHeight = event.nativeEvent.contentOffset.y;
                }}
                renderBackground={() => (
                    <Image style={{"width": "100%", "height": 350}} source={require('./assets/castle.jpg')}></Image>
                )}
                renderForeground={() => (
                    <View style={{width: "100%", height: 300}}>
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
                                    googleButton: null
                            }
                        </View>
                    </View>
                )}>
                    <View style={{zIndex: 0, marginTop: 15, paddingTop: 20, width: "100%"}}>
                        <Collapsible collapsed={this.state.page != 'login'}>
                            <Login scrollTo={this.scrollTo} visible={this.state.page == 'login'} />
                        </Collapsible>
                        <Collapsible collapsed={this.state.page != 'sign up'}>
                            <SignUp scrollTo={this.scrollTo} visible={this.state.page == 'sign up'} />
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
