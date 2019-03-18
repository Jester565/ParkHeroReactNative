import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import Theme from '../../Theme';

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class InviteRow extends React.PureComponent {
    onPress = () => {
        this.props.onPress({
            id: this.props.id,
            name: this.props.name,
            profilePicUrl: this.props.profilePicUrl
        });
    }

    onAccept = () => {
        this.props.onAccept({
            isOwner: this.props.isOwner,
            id: this.props.id,
            name: this.props.name,
            profilePicUrl: this.props.profilePicUrl
        });
    }

    onDecline = () => {
        this.props.onDecline({
            isOwner: this.props.isOwner,
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
        if (this.props.isOwner) {
            cardStyle.backgroundColor = "#444444";
        }

        return (
            <TouchableOpacity
                onPress={this.onPress}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <CachedImage style={{ width: 34, height: 34, borderRadius: 17 }} source={{uri: S3_URL + this.props.profilePicUrl + '-0.webp'}}/>
                    { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }}>
                        <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold', width: "60%" }}>
                            {this.props.name}
                        </Text>
                        {
                            (this.props.isOwner)?
                            (
                                <Icon
                                name='close'
                                iconStyle={{
                                    backgroundColor: 'red'
                                }}
                                onPress={this.onDecline}
                                size={30}
                                />
                            ): (
                                <View style={{ width: "40%", flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }}>
                                    <Icon
                                    name='check'
                                    iconStyle={{
                                        backgroundColor: 'lime'
                                    }}
                                    onPress={this.onAccept}
                                    />
                                    <Icon
                                    name='close'
                                    iconStyle={{
                                        backgroundColor: 'red'
                                    }}
                                    onPress={this.onDecline}
                                    size={30}
                                    />
                                </View>
                            )
                        }
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  }