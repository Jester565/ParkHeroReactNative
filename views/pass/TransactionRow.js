import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import moment from 'moment';
import Theme from '../../Theme';

export default class TransactionRow extends React.PureComponent {
    constructor(props) {
        super(props);
        this.IMG_HEIGHT = 100;
    }

    onPress = () => {
        if (this.props.onPress) {
            this.props.onPress(this.props.id);
        }
    }

    onLongPress = () => {
        if (this.props.onLongPress) {
            this.props.onLongPress(this.props.id);
        }
    }

    render() {
        var screenWidth = Dimensions.get('window').width;

        var fontSize = 18;
        var cardStyle = {
            width: screenWidth / 2.0,
            height: this.props.height,
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: '#EEEEEE',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333',
            margin: 5
        };
        var now = moment();
        var fpDateTimeStr = null;
        var relativeTimeStr = null;
        var orderDateTimeStr = null;
        toDurStr = (mins) => {
            if (mins < 60) {
                return Math.trunc(mins).toString + ' Mins';
            } else if (mins < 150) {
                var hrMins = (Math.trunc(mins) % 60);
                return `${Math.trunc(mins / 60.0)} hr${(mins / 60.0 >= 2)? 's': ''} ${(hrMins > 0)? ' & ' + hrMins + ` min${(hrMins > 1)? 's': ''}`: ''}`;
            } else {
                return `~${Math.round(mins / 60.0)} hrs`;
            }
        }
        if (this.props.startDateTimeStr != null) {
            var startDateTime = moment(this.props.startDateTimeStr, "YYYY-MM-DD HH:mm:ss");
            fpDateTimeStr = startDateTime.format("h:mm A");
            var startDuration = moment.duration(startDateTime.diff(now));
            var startMinDiff = startDuration.asMinutes();
            if (startMinDiff > 0) {
                relativeTimeStr = "Ready in " + toDurStr(startMinDiff);
                cardStyle.borderColor = "blue";
            } else if (startMinDiff < 0) {
                var endDateTime = moment(this.props.endDateTimeStr, "YYYY-MM-DD HH:mm:ss");
                var endDuration = moment.duration(endDateTime.diff(now));
                var endMinDiff = Math.round(endDuration.asMinutes());
                if (endMinDiff >= 0) {
                    relativeTimeStr = "Expires in " + toDurStr(endMinDiff);
                    cardStyle.borderColor = "green";
                } else {
                    relativeTimeStr = "Expired " + toDurStr(-endMinDiff) + " Ago";
                    cardStyle.borderColor = "red";
                }
            }
        } else if (this.props.fastPassTimeStr) {
            var fastPassTime = moment(this.props.fastPassTimeStr, "YYYY-MM-DD HH:mm:ss");
            fpDateTimeStr = fastPassTime.format("h:mm A");
        }
        if (this.props.orderDateTimeStr != null) {
            var orderDateTime = moment(this.props.orderDateTimeStr, "YYYY-MM-DD HH:mm:ss");
            orderDateTimeStr = orderDateTime.format("h:mm A");
        }

        var imgWidth = screenWidth / 2.0 - 20;
        return (
            <View style={{
                position: 'absolute',
                left: (this.props.planned)? screenWidth / 2.0: 0,
                top: this.props.y
            }}>
                <TouchableOpacity
                onPress={this.onPress}
                onLongPress={this.onLongPress}>
                    <View 
                    elevation={10} 
                    style={cardStyle}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignContent: 'center' }}>
                            <View 
                            style={{
                                width: imgWidth, 
                                height: this.IMG_HEIGHT
                            }}>
                                <CachedImage
                                style={{ 
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: imgWidth, 
                                    height: this.IMG_HEIGHT,
                                    justifyContent: 'center',
                                    alignItems: 'center' 
                                }} 
                                resizeMode={'cover'} 
                                blurRadius={10} 
                                source={{uri: this.props.signedPicUrl}}/>

                                <CachedImage 
                                style={{ 
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: imgWidth, 
                                    height: this.IMG_HEIGHT
                                }} 
                                resizeMode={'contain'} 
                                source={{uri: this.props.signedPicUrl}}/>
                                 {
                                    (orderDateTimeStr)? (
                                        <Text style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                            fontSize: fontSize,
                                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                            color: 'white',
                                            padding: 5,
                                            borderBottomLeftRadius: 5
                                        }}>
                                            {orderDateTimeStr}
                                        </Text>
                                    ): null
                                }
                                <Text style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    fontSize: fontSize,
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                    color: 'white',
                                    padding: 5,
                                    borderBottomRightRadius: 5
                                }}>
                                    {fpDateTimeStr}
                                </Text>
                            </View>
                            <Text style={{
                                    numberOfLines: 1,
                                    fontSize: fontSize,
                                    backgroundColor: 'black',
                                    color: 'white',
                                    width: "100%",
                                    textAlign: 'center'
                                }}>
                                    {this.props.name}
                            </Text>
                            <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                                <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                                    {
                                        (relativeTimeStr)? (
                                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                                    {relativeTimeStr}
                                                </Text>
                                            </View>
                                        ): null
                                    }
                                </View>
                                <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                                    {
                                        this.props.passGroups.map((passGroup) => {
                                            if (this.props.planned) {
                                                return (<Text style={{
                                                    fontSize: fontSize,
                                                    backgroundColor: passGroup.color,
                                                    padding: 5,
                                                    borderRadius: 10
                                                }}>
                                                    {`${passGroup.name} : ${passGroup.priority}`} 
                                                </Text>)
                                            } else {
                                                return (<Text style={{
                                                    fontSize: fontSize,
                                                    backgroundColor: passGroup.color,
                                                    padding: 5,
                                                    borderRadius: 10
                                                }}>{passGroup.name}</Text>)
                                            }
                                        })
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }
  }