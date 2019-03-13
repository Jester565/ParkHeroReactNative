import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight, Text } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import Theme from '../../Theme';
import PassParallax from '../pass/PassParallax';

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Profile extends React.Component {
    static navigationOptions = {
        title: 'Profile',
        header: null
    };

    constructor(props) {
        super();
        const { navigation } = props;
                var user = navigation.getParam('user');
                var authenticated = navigation.getParam('authenticated');
        this.state = {
            user: user,
            authenticated: authenticated,
            passes: null,
            splitters: [
                "us-west-2:1341",
                "us-west-2:1232",
                "us-west-2:1414"
            ]
        };
    }

    renderHeaderBackground = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        return (
        <View style={{flex: 1}}>
            <CachedImage
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3,
                justifyContent: 'center',
                alignItems: 'center' }} 
            resizeMode={'cover'} 
            blurRadius={1}
            source={{uri: S3_URL + this.state.user.profilePicUrl}} />
            <CachedImage 
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3 }} 
            resizeMode={'contain'}
            source={{uri: S3_URL + this.state.user.profilePicUrl}} />
        </View>);
    }

    render() {
        const { navigation } = this.props;
        var isMe = navigation.getParam('isMe');
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (<View style={{
            flex: 1
        }}>
            <PassParallax
            headerHeight={screenHeight * 0.3}
            renderHeaderBackground={this.renderHeaderBackground}
            editingEnabled={true}
            splittingEnabled={true}
            passes={this.state.passes}
            splitters={this.state.splitters}
            currentUserID={(this.props.isMe)? this.state.user.id: null}>
                <Text>BODY</Text>
            </PassParallax>
        </View>);
    }
};
