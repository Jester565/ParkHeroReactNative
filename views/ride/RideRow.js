import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import moment from 'moment';

export default class RideRow extends React.PureComponent {
    render() {
        if (!this.props.visible) {
            return null;
        }
        var fontSize = 18;
        var cardStyle = {
            width: "100%", 
            flex: 1, 
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: '#444444',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.props.selected) {
            cardStyle.backgroundColor = "#0080ff";
        } else if (this.props.waitRating != null) {
            cardStyle.backgroundColor = `hsl(${Math.round((this.props.waitRating * 120)/10)}, 100%, 50%)`
        }

        var picUrl = this.props.picUrl;
        if (picUrl != null) {
            var dotIdx = picUrl.lastIndexOf('.');
            picUrl = 'https://s3-us-west-2.amazonaws.com/disneyapp3/' + picUrl.substr(0, dotIdx) + '-0-c' + picUrl.substr(dotIdx);
            console.log("GETTING PIC: ", picUrl);
        }
        return (
            <TouchableOpacity
                onPress={() => { this.props.onPress(this.props.id) }}
                onLongPress={() => { this.props.onLongPress(this.props.id) }}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <CachedImage style={{ width: 60, height: 60, borderRadius: 30 }} source={{uri: picUrl}}/>
                    { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                    {this.props.name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize }}>
                                    {(this.props.waitTime != null)? this.props.waitTime: this.props.status}
                                </Text>
                            </View>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                    {(this.props.fastPassTime != null)? moment(this.props.fastPassTime, 'HH:mm:ss').format('h:mm A'): "--"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  }