import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import Theme from '../../Theme';

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Home extends React.Component {
    constructor(props) {
        super();
        console.log("USER: ", JSON.stringify(props.user));
        this.state = {
            
        };
    }

    onOpenCamera = () => {

    }

    onOpenFriends = () => {
        this.props.navigation.navigate('Friends', {
            currentUser: this.props.user
        });
    }

    onOpenProfile = () => {
        this.props.navigation.navigate('Profile', {
            isMe: true,
            user: this.props.user,
            authenticated: this.props.authenticated,
            signOut: this.props.signOut
        });
    }

    onOpenAuthenticator = () => {
        this.props.navigation.navigate('Auth', {
            onSignIn: this.props.onSignIn
        });
    }

    render() {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        var headerWidth = screenWidth;
        var profileImgWidth = screenWidth * 0.4;
        var headerButtonSize = (screenWidth - profileImgWidth) / 4.0;
        var headerButtonXOffset = headerButtonSize / 2.0;
        var headerHeight = 100;
        return (
        <View>
            <View style={{ width: headerWidth, height: profileImgWidth }}>
                <TouchableOpacity
                onPress={this.onOpenCamera}
                style={{ 
                    left: 0,
                    top: 0,
                    width: headerWidth / 2.0,
                    height: headerHeight,
                    position: 'absolute',
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    borderBottomWidth: 2,
                    borderColor: Theme.PRIMARY_FOREGROUND,
                    borderBottomLeftRadius: 6
                    }}>
                    <Icon
                        containerStyle={{
                            position: "absolute",
                            left: headerButtonXOffset,
                            top: (headerHeight - headerButtonSize) / 2.0
                        }}
                        iconStyle={{
                            color: Theme.PRIMARY_FOREGROUND
                        }}
                        size={headerButtonSize}
                        name="camera" />
                </TouchableOpacity>
                <TouchableOpacity
                onPress={this.onOpenFriends}
                style={{ 
                    right: 0,
                    top: 0,
                    width: headerWidth / 2.0,
                    height: headerHeight,
                    position: 'absolute',
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    borderBottomWidth: 2,
                    borderColor: Theme.PRIMARY_FOREGROUND,
                    borderBottomRightRadius: 6 }}>
                    <Icon
                        containerStyle={{
                            position: "absolute",
                            right: headerButtonXOffset,
                            top: (headerHeight - headerButtonSize) / 2.0
                        }}
                        iconStyle={{
                            color: Theme.PRIMARY_FOREGROUND
                        }}
                        size={headerButtonSize}
                        name="people" />
                </TouchableOpacity>
                <TouchableHighlight
                onPress={this.onOpenProfile}
                style={{ 
                    left: (screenWidth - profileImgWidth) / 2.0,
                    top: 0,
                    width: profileImgWidth,
                    height: profileImgWidth,
                    position: 'absolute',
                    backgroundColor: Theme.SECONDARY_BACKGROUND,
                    borderColor: Theme.PRIMARY_FOREGROUND,
                    borderWidth: 2,
                    borderRadius: profileImgWidth / 2.0
                }}>
                    <Image
                    resizeMode={'cover'} 
                    style={{width: profileImgWidth - 4, height: profileImgWidth - 4, borderRadius: (profileImgWidth - 4) / 2.0}}
                    source={{uri: S3_URL + this.props.user.profilePicUrl + "-1.webp"}} />
                </TouchableHighlight>
            </View>
            {
                (!this.props.authenticated)? (
                <View style={{ width: "100%", flexDirection: 'row', alignContent: 'center', marginTop: 15, paddingBottom: 15, paddingTop: 15, borderTopWidth: 4, borderBottomWidth: 4, borderColor: 'rgba(0, 0, 0, .4)' }}>
                    <Button
                        title='LOGIN' 
                        onPress={this.onOpenAuthenticator}
                        rounded={true} 
                        backgroundColor={'blue'} 
                        containerViewStyle={{ flex: 1 }} />
                </View>): null
            }
                
        </View>);
    }
};
