import React from 'react';
import { Text, View, Dimensions, Image, Picker } from 'react-native';
import { Button } from 'react-native-elements';

import moment from 'moment';
import { Calendar } from 'react-native-calendars';
import { ScrollView } from 'react-native-gesture-handler';
import Theme from '../../Theme';
import { CachedImage } from 'react-native-cached-image';
import { GetBlockLevel } from '../pass/PassLevel';
import PassList from '../pass/PassList';
import DateTimePicker from 'react-native-modal-datetime-picker';

var S3_URL = 'https://s3-us-west-2.amazonaws.com/disneyapp3/';

export default class ScheduleCalendar extends React.Component {
    static navigationOptions = {
        title: 'ScheduleCalendar',
        header: null
    };

    constructor(props) {
        super();

        const { navigation } = props;
        var dateTime = navigation.getParam('dateTime');

        this.COLORS = [ '#89cff0', '#f9423a' ];

        this.state = {
            blockLevelStr: 'socal-select-annual',
            dateTime: (dateTime != null)? dateTime: moment()
        }
    }

    schedulesToCalendarInfo = () => {
        const { navigation } = this.props;
        var schedules = navigation.getParam('schedules');
        var minDate = null;
        var maxDate = null;
        for (var dateStr in schedules) {
            var date = moment(dateStr, 'YYYY-MM-DD');
            if (minDate == null || date < minDate) {
                minDate = date;
            }
            if (maxDate == null || date > maxDate) {
                maxDate = date;
            }
        }
        var dateI = minDate.clone();
        var lastBlocks= null;
        var markedDates = {};
        var lastDateStr = null;
        var selectedDateStr = this.state.dateTime.format("YYYY-MM-DD");
        while (dateI <= maxDate) {
            var dateStr = dateI.format("YYYY-MM-DD");
            console.log("RUNNING DATE: ", dateStr);
            var parkSchedules = schedules[dateStr];
            var blocks = [];
            var periods = [];
            parkSchedules.forEach((parkSchedule, i) => {
                var blockLevel = parkSchedule.blockLevel;
                var filterBlockLevel = GetBlockLevel(this.state.blockLevelStr);
                var blocked = (blockLevel >= filterBlockLevel);
                periods.push({
                    startingDay: (!blocked && (lastBlocks == null || lastBlocks[i])), 
                    endingDay: true, 
                    color: (!blocked)? this.COLORS[i]: 'transparent'
                });
                blocks.push(blocked);
                if (lastDateStr != null) {
                    markedDates[lastDateStr]["periods"][i].endingDay = (blocked && (lastBlocks != null && !lastBlocks[i]));
                }
            });
            markedDates[dateStr] = { periods: periods, selected: (dateStr == selectedDateStr) };
            lastBlocks = blocks;
            lastDateStr = dateStr;
            dateI.add(1, 'day');
        }
        console.log("MARK DATES: ", JSON.stringify(markedDates));
        return {
            minDate: minDate.format("YYYY-MM-DD"),
            maxDate: maxDate.format("YYYY-MM-DD"),
            markedDates: markedDates
        };
    }

    setDateTime = (date, time) => {
        return new Promise((resolve) => {
            var dateTime = moment(`${date.format("YYYY-MM-DD")} ${time.format("HH:mm:ss")}`, "YYYY-MM-DD HH:mm:ss");
            console.log("DATETIME: ", dateTime.format("YYYY-MM-DD HH:mm:ss"));
            this.setState({
                dateTime: dateTime
            }, () => {
                resolve();
            });
        });
    }

    onDatePress = (date) => {
        console.log("DATESTER: ", JSON.stringify(date), date.dateStr);
        this.setDateTime(moment(date.dateString, "YYYY-MM-DD"), this.state.dateTime);
    }

    onDateLongPress = (date) => {
        this.setDateTime(moment(date.dateString, "YYYY-MM-DD"), this.state.dateTime).then(() => {
            this.onSubmitDate();
        });
    }

    onSubmitDate = () => {
        const { navigation } = this.props;
        var onDateSelected = navigation.getParam('onDateSelected');
        onDateSelected(this.state.dateTime);

        navigation.goBack();
    }

    getTimeRangeStr = (startTimeStr, endTimeStr) => {
        var startTime = moment(startTimeStr, "HH:mm:ss");
        var endTime = moment(endTimeStr, "HH:mm:ss");
        return `${startTime.format("h A")} - ${endTime.format("h A")}`;
    }

    renderParkSchedule = (parkSchedule, i) => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        var calColor = this.COLORS[i];
        var imgSize = 70;
        const { navigation } = this.props;
        var userPasses = navigation.getParam('userPasses');
        var onPassPress = navigation.getParam('onPassPress');
        console.log("ICON URL: ", parkSchedule.parkIconUrl);
        return (<View style={{
            marginBottom: 10,
            paddingTop: 4,
            paddingBottom: 4
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignContent: 'center',
                backgroundColor: '#121212',
                paddingBottom: 2,
                marginBottom: 2
            }}>
                <Image style={{ 
                    width: imgSize, 
                    height: imgSize, 
                    borderRadius: imgSize / 2,
                    borderWidth: 3,
                    borderColor: calColor }} 
                source={{uri: S3_URL + parkSchedule.parkIconUrl}} />
                <View style={{
                    flexDirection: 'column',
                    justifyContent: 'space-evenly',
                    alignContent: 'center',
                    width: screenWidth - imgSize
                }}>
                    <Text style={{
                        width: screenWidth - imgSize,
                        color: Theme.PRIMARY_FOREGROUND,
                        fontSize: 28,
                        flex: 1,
                        textAlign: 'center'
                    }}>{parkSchedule.parkName}</Text>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'space-evenly',
                        width: screenWidth - imgSize
                    }}>
                        <Text style={{
                            color: Theme.PRIMARY_FOREGROUND,
                            fontSize: 19,
                            textAlign: 'center'
                        }}>
                            {
                                `Open\n${this.getTimeRangeStr(parkSchedule.openTime, parkSchedule.closeTime)}`
                            }
                        </Text>
                        {
                            (parkSchedule.magicStartTime != null)? (
                                <Text style={{
                                    color: Theme.PRIMARY_FOREGROUND,
                                    fontSize: 19,
                                    textAlign: 'center'
                                }}>
                                    {
                                        `Magic Hours\n${this.getTimeRangeStr(parkSchedule.magicStartTime, parkSchedule.magicEndTime)}`
                                    }
                                </Text>
                            ): null
                        }
                    </View>
                </View>
            </View>
            <PassList 
                userPasses={userPasses}
                blockLevel={parkSchedule.blockLevel}
                onPress={onPassPress}
                onLongPress={onPassPress} />
        </View>);
    }

    onBlockLevelPick = (blockStr) => {
        this.setState({
            blockLevelStr: blockStr
        });
    }

    onTimePress = () => {
        this.setState({
            showTimePicker: true
        })
    }

    onTimeCancelled = () => {
        this.setState({
            showTimePicker: false
        });
    }

    onTimeSelected = (jDate) => {
        const { navigation } = this.props;

        var time = moment(jDate);
        this.setDateTime(this.state.dateTime, time);
        this.setState({
            showTimePicker: false
        });
    }

    render() {
        var calendarInfo = this.schedulesToCalendarInfo();
        var parkSchedules = null;
        const { navigation } = this.props;
        var schedules = navigation.getParam('schedules');
        if (this.state.dateTime != null && schedules != null) {
            parkSchedules = schedules[this.state.dateTime.format("YYYY-MM-DD")];
        }
        return (
        <ScrollView style={{
            backgroundColor: Theme.SECONDARY_BACKGROUND
        }}>
            <Picker
            selectedValue={this.state.blockLevelStr}
            style={{
                width: "50%",
                height: 50, 
                color: Theme.PRIMARY_FOREGROUND
            }}
            onValueChange={this.onBlockLevelPick}>
                <Picker.Item label="socal-select-annual" value="socal-select-annual" />
                <Picker.Item label="socal-annual" value="socal-annual" />
                <Picker.Item label="deluxe" value="deluxe" />
                <Picker.Item label="signature" value="signature" />
                <Picker.Item label="signature-plus" value="signature-plus" />
            </Picker>
            <Calendar
                style={{
                    borderWidth: 1,
                    borderColor: 'gray'
                }}
                theme={{
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    calendarBackground: 'black',
                    dayTextColor: 'white',
                    monthTextColor: '#CCCCCC',
                    textDisabledColor: '#333333'
                }}
                minDate={calendarInfo.minDate}
                maxDate={calendarInfo.maxDate}
                markedDates={calendarInfo.markedDates}
                onDayPress={this.onDatePress}
                onDayLongPress={this.onDateLongPress}
                markingType='multi-period' />
            <View style={{
                width: "100%",
                flexDirection: "column",
                alignContent: "center"
            }}>
                <Text style={{
                    flex: 1,
                    color: Theme.PRIMARY_FOREGROUND,
                    borderBottomWidth: 3,
                    borderBottomColor: 'white',
                    fontSize: 35
                }}>{this.state.dateTime.format("MMM DD")}</Text>
            </View>
            {
                (parkSchedules != null)? (
                    parkSchedules.map((parkSchedule, i) => {
                        return this.renderParkSchedule(parkSchedule, i);  
                    })
                ): null
            }
            <DateTimePicker
                isVisible={this.state.showTimePicker}
                onConfirm={this.onTimeSelected}
                onCancel={this.onTimeCancelled}
                mode='time' />
                
            <Button
                buttonStyle={{
                    marginBottom: 20
                }}
                title={this.state.dateTime.format("h:mm A")}
                rounded={true}
                backgroundColor={'blue'}
                onPress={this.onTimePress} />
            <Button
                title='SELECT' 
                rounded={true} 
                backgroundColor={'green'} 
                onPress={this.onSubmitDate} />
        </ScrollView>);
    }
};
