import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class UserRow extends React.PureComponent {
    onPress = () => {
        this.props.onPress({
            id: this.props.id,
            name: this.props.name,
            profilePicUrl: this.props.profilePicUrl
        });
    }

    onLongPress = () => {
        this.props.onLongPress({
            id: this.props.id,
            name: this.props.name,
            profilePicUrl: this.props.profilePicUrl
        });
    }

    render() {
        var fontSize = 18;
        var cardStyle = {
            width: "100%", 
            flex: 1, 
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: '#999999',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.props.selected) {
            cardStyle.backgroundColor = "#0080ff";
        }

        return (
            <TouchableOpacity
                onPress={this.onPress}
                onLongPress={this.onLongPress}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <CachedImage style={{ width: 34, height: 34, borderRadius: 17 }} source={{uri: S3_URL + this.props.profilePicUrl + '-0.webp'}}/>
                    { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                    {this.props.name}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  }