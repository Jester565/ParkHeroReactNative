import React from 'react';
import { View, Text } from 'react-native';
import { Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import moment from 'moment';
import AttractionWrapper from './AttractionWrapper';

export default class Event extends React.Component {
    static navigationOptions = {
        title: 'Event',
        header: null
    };

    constructor(props) {
        super();
        const { navigation } = props;
        var event = navigation.getParam('event');
        var isToday = navigation.getParam('isToday');

        this.state = {
            event: event,
            isToday: isToday
        }
    }

    getEvent = () => {
        return this.state.event;
    }

    render() {
        const { navigation } = this.props;
        
        var fontSize = 30;

        var availableDateTimeStr = "";
        var passedDateTimeStr ="";
        var now = moment();
        var availableThreshold = now.add(30, 'minutes');
        for (var dateTimeStr of this.state.event.dateTimes) {
            var dateTime = moment(dateTimeStr, "YYYY-MM-DD HH:mm:ss");
            if (dateTime < availableThreshold && this.state.isToday) {
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

        return (
        <AttractionWrapper
            attraction={this.state.event}
            onAttractionUpdate={navigation.getParam('onEventUpdate')}>
            <View>
                <Text style={{
                    fontSize: fontSize,
                    textAlign: "center",
                    color: Theme.PRIMARY_FOREGROUND
                }}>{availableDateTimeStr}</Text>
                <Text style={{
                    fontSize: fontSize,
                    textAlign: "center",
                    color: Theme.DISABLED_FOREGROUND,
                    marginTop: 20
                }}>{passedDateTimeStr}</Text>
            </View>
        </AttractionWrapper>);
    }
};
