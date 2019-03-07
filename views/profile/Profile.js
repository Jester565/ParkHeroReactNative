import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import Theme from '../../Theme';
import PassPager from '../pass/PassPager';

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
            passes: [{
                id: "123",
                name: "Alex Craig",
                expirationDT: "2019-03-06 12:00:00",
                type: "SoCal-Annual",
                user: user
            }]
        };
    }

    render() {
        const { navigation } = this.props;
                var isMe = navigation.getParam('isMe');

                var screenWidth = Dimensions.get('window').width;
                var screenHeight = Dimensions.get('window').height;
        return (<View>
            <View 
            style={{
                width: screenWidth, 
                height: screenHeight * 0.6
            }}>
                <CachedImage
                style={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: screenWidth, 
                    height: screenHeight * 0.6,
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
                    height: screenHeight * 0.6 }} 
                resizeMode={'contain'}
                source={{uri: S3_URL + this.state.user.profilePicUrl}}/>
            </View>
            <PassPager passes={this.state.passes} editingEnabled={true} />
        </View>);
    }
};
