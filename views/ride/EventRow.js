import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import moment from 'moment';
import Theme from '../../Theme';

export default class EventRow extends React.PureComponent {
    onPress = () => {
        this.props.onPress(this.props.id);
    }

    onLongPress = () => {
        this.props.onLongPress(this.props.id);
    }

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
            backgroundColor: '#999999',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.props.selected) {
            cardStyle.backgroundColor = "#0080ff";
        }
        var availableDateTimeStr = "";
        var passedDateTimeStr ="";

        
        var now = moment();
        var availableThreshold = now.add(30, 'minutes');
        for (var dateTimeStr of this.props.dateTimes) {
            var dateTime = moment(dateTimeStr, "YYYY-MM-DD HH:mm:ss");
            if (dateTime < availableThreshold && this.props.isToday) {
                if (passedDateTimeStr.length > 0) {
                    passedDateTimeStr += "   ";
                }
                passedDateTimeStr += dateTime.format("h:mm A");
            } else {
                if (availableDateTimeStr.length > 0) {
                    availableDateTimeStr += "   ";
                }
                availableDateTimeStr += dateTime.format("h:mm A");
            }
        }
        if (availableDateTimeStr.length > 0) {
            cardStyle.backgroundColor = "#ADFF2F";
        }

        return (
            <TouchableOpacity
                onPress={this.onPress}
                onLongPress={this.onLongPress}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <CachedImage style={{ width: 60, height: 60, borderRadius: 30 }} source={{uri: this.props.signedPicUrl}}/>
                    { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                    {this.props.name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <Text style={{
                                fontSize: fontSize,
                                textAlign: "center",
                                color: "#000000"
                            }}>{availableDateTimeStr}</Text>
                            <Text style={{
                                fontSize: fontSize,
                                textAlign: "center",
                                color: '#444444',
                            }}>{passedDateTimeStr}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  }