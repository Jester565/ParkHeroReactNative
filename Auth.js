import React from 'react';
import { StyleSheet, Text, View, Image, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Collapsible from 'react-native-collapsible';
import Login from './Login';
import SignUp from './SignUp';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';


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
            scrollHeight: 0,
            page: 'google',
            googleSigningIn: false
        };
    }

    navigateTo = (pageName) => {
        this.setState({
            "page": pageName
        });
    }

    onGooglePressed = () => {

    }

    render() {
        var googleButton = <Button color="black" buttonStyle={styles.optionButton} title='Google' onClick={this.onGooglePressed} />
        return (
                <ParallaxScrollView
                backgroundColor="blue"
                contentBackgroundColor="white"
                parallaxHeaderHeight={300}
                parallaxBackgroundScrollSpeed={30}
                stickyHeaderHeight={110}
                fadeOutForeground={false}
                renderBackground={() => (
                    <Image style={{"width": "100%", "height": 350}} source={require('./assets/castle.jpg')}></Image>
                )}
                renderForeground={() => (
                    <View style={{width: "100%", height: 300}}>
                        <View style={{ height: 300, flex: 1 }}>
                            <View style={{ height: 300, flex: 1 }}>
                                <View style={{ height: 300, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 30, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 5, padding: 5}}>Welcome Back</Text>
                                </View>
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
                )}
                onScroll={(event) => {
                    this.setState({
                        scrollHeight: event.nativeEvent.contentOffset.y
                    });
                }}>
                    <View style={{zIndex: 0, marginTop: 15, paddingTop: 20, width: "100%"}}>
                        <Collapsible collapsed={this.state.page != 'login'}>
                            <Login />
                        </Collapsible>
                        <Collapsible collapsed={this.state.page != 'sign up'}>
                            <SignUp />
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
