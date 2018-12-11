import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Icon, Slider } from 'react-native-elements';
import Theme from '../../Theme';
import moment from 'moment';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Toast from 'react-native-root-toast';

export default class RidesDateTimeSelector extends React.Component {
    constructor(props) {
        super();
        this.state = {
            dateTime: null,
            minDayOffset: 0,
            maxDayOffset: 0
        };
    }

    componentWillMount() {
        if (this.props.schedules != null) {
            this.initSchedules(this.props);
        }
    }
    
    componentWillReceiveProps(newProps) {
        if (newProps.schedules != null && this.state.dateTime == null) {
            this.initSchedules(newProps);
        }
    }
    
    initSchedules = (props) => {
        var schedules = props.schedules;
        var scheduleNow = this.getParkDateForDateTime(moment());
        var minDayOffset = 0;
        var maxDayOffset = 0;
        for (var dateStr in schedules) {
            var date = moment(dateStr, 'YYYY-MM-DD');
            var dayDiff = date.diff(scheduleNow, 'days');
            console.log("COMPARING: ", dateStr , "-", dayDiff);
            if (dayDiff < minDayOffset) {
                minDayOffset = dayDiff;
            } else if (dayDiff > maxDayOffset) {
                maxDayOffset = dayDiff;
            }
        }
        var parkSchedules = this.getParkSchedules(scheduleNow, schedules);
        if (parkSchedules == null) {
            console.error("schedules does not contain today's date!");
            return;
        }
        var resortDateTimes = this.getResortDateTimes(scheduleNow, parkSchedules);
        var rangedDateTime = this.getRangedDateTime(moment(), resortDateTimes);
        this.setDateTime(rangedDateTime, props);
        this.setState({
            nowDate: scheduleNow,
            minDayOffset: minDayOffset,
            maxDayOffset: maxDayOffset
        });
    }

    getParkDateForDateTime = (dateTime) => {
        var date = dateTime.clone().subtract(4, 'hours');
        date.set({hour:0,minute:0,second:0,millisecond:0});
        return date;
    }

    getParkSchedules = (scheduleDate, schedules) => {
        var parkSchedules = schedules[scheduleDate.format('YYYY-MM-DD')];
        return parkSchedules;
    }

    getResortDateTimes = (date, parkSchedules) => {
        var dateStr = date.format('YYYY-MM-DD');
        var openDateTime = moment(dateStr + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss');
        var closeDateTime = moment(dateStr + ' 12:00:00', 'YYYY-MM-DD HH:mm:ss');
        for (var schedule of parkSchedules) {
            var parkOpenDateTime = moment(dateStr + ' ' + schedule["openTime"], 'YYYY-MM-DD HH:mm:ss');
            if (parkOpenDateTime < openDateTime) {
                openDateTime = parkOpenDateTime;
            }
            var parkCloseDateTime = moment(dateStr + ' ' + schedule["closeTime"], 'YYYY-MM-DD HH:mm:ss');
            if (parkCloseDateTime.hours() < 12) {
                parkCloseDateTime.add(1, 'days');
            }
            if (parkCloseDateTime > closeDateTime) {
                closeDateTime = parkCloseDateTime;
            }
        }
        return { openDateTime: openDateTime, closeDateTime: closeDateTime };
    }

    getDateTimeFromTimePercent = (timePercent, resortDateTimes) => {
        var openDateTime = resortDateTimes["openDateTime"];
        var closeDateTime = resortDateTimes["closeDateTime"];
        var resortOpenMinutes = (closeDateTime.valueOf() - openDateTime.valueOf()) / (60 * 1000);
        var minutes = resortOpenMinutes * timePercent;
        openDateTime.add(minutes, 'minutes');
        return openDateTime;
    }

    getTimePercentFromDateTime = (targetDateTime, resortDateTimes) => {
        var timePercent = 0;
        var openDateTime = resortDateTimes["openDateTime"];
        var closeDateTime = resortDateTimes["closeDateTime"];
        var minsOpen = moment.duration(closeDateTime.diff(openDateTime)).asMinutes();
        var minsSinceOpen = moment.duration(targetDateTime.diff(openDateTime)).asMinutes();
        timePercent = minsSinceOpen / minsOpen;
        if (timePercent > 1) {
            timePercent = 1;
        } else if (timePercent < 0) {
            timePercent = 0;
        }
        return timePercent;
    }

    setDayOffset = (offset, currentOffset, currentDateTime, schedules) => {
        var newDateTime = currentDateTime.clone();
        newDateTime.add(offset - currentOffset, 'days');
        var newDate = this.getParkDateForDateTime(newDateTime);
        var parkSchedules = this.getParkSchedules(newDate, schedules);
        if (parkSchedules == null) {

        }
        var resortDateTimes = this.getResortDateTimes(newDate, parkSchedules);
        var rangedDateTime = this.getRangedDateTime(newDateTime, resortDateTimes);
        this.setDateTime(rangedDateTime);
    }

    getRangedDateTime = (dateTime, resortDateTimes) => {
        var timePercent = this.getTimePercentFromDateTime(dateTime, resortDateTimes);
        var rangedDateTime = this.getDateTimeFromTimePercent(timePercent, resortDateTimes);
        return rangedDateTime;
    }

    onTimeModalSubmit = (selectedDateTime, schedules) => {
        if (selectedDateTime.hours() <= 4) {
            selectedDateTime.add(4, 'hours');
        }
        var selectedDate = this.getParkDateForDateTime(selectedDateTime);
        var parkSchedules = this.getParkSchedules(selectedDate, schedules);
        var resortDateTimes = this.getResortDateTimes(selectedDate, parkSchedules);
        var rangedDateTime = this.getRangedDateTime(selectedDateTime, resortDateTimes);
        this.setState({
            dateTime: rangedDateTime
        });
        this.props.onDateTimeModalClosed();
    }

    setTimePercent = (timePercent, resortDateTimes) => {
        var dateTime = this.getDateTimeFromTimePercent(timePercent, resortDateTimes);
        this.setDateTime(dateTime);
    }

    setDateTime = (dateTime, props = null) => {
        this.setState({
            dateTime: dateTime
        });
        if (props == null) {
            props = this.props;
        }
        props.onDateTimeChanged(dateTime);
    }

    render() {
        if (this.props.schedules == null) {
            return <ActivityIndicator small color="#CCCCCC" />
        }

        var dateTime = this.state.dateTime;
        var scheduleDate = this.getParkDateForDateTime(dateTime);
        var dayOffset = scheduleDate.diff(this.state.nowDate, 'days');
        
        var parkSchedules = this.getParkSchedules(scheduleDate, this.props.schedules);
        var resortDateTimes = this.getResortDateTimes(scheduleDate, parkSchedules);
        var timePercent = this.getTimePercentFromDateTime(dateTime, resortDateTimes);

        var dateStr = null;
        var timeStr = null;
        if (dateTime != null) {
            dateStr = dateTime.format("dddd, MM/DD");
            if (dateStr == moment().format("dddd, MM/DD")) {
                dateStr = null;
            }
            timeStr = dateTime.format('h:mm A');
        }
        return (<View style={{ width: '100%', flex:1, flexDirection: 'column', backgroundColor: Theme.PRIMARY_BACKGROUND }}>
            <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: Theme.PRIMARY_BACKGROUND }}>
                <Icon
                    name="navigate-before"
                    color={(dayOffset > this.state.minDayOffset)? Theme.PRIMARY_FOREGROUND: 'black'}
                    disabled={dayOffset <= this.state.minDayOffset}
                    size={25}
                    containerStyle={{ textAlign: "center", width: 50, height: 50 }}
                    onPress={() => { this.setDayOffset(dayOffset - 1, dayOffset, dateTime, this.props.schedules) }} />
                <View style={{ width: '70%', flexDirection: 'column', alignItems: 'center' }}>
                    <Text style={{ color: Theme.PRIMARY_FOREGROUND, fontSize: 15 }}>{(dateStr != null)? dateStr + " ": ""}{timeStr}</Text>
                    <Slider
                        style={{ width: "100%" }}
                        trackStyle={{ backgroundColor: "black" }}
                        thumbStyle={{ backgroundColor: Theme.PRIMARY_FOREGROUND }}
                        minimumTrackTintColor="white"
                        value={timePercent}
                        onValueChange={(value) => { this.setTimePercent(value, resortDateTimes) }} />
                </View>
                <Icon
                    name="navigate-next"
                    color={(dayOffset < this.state.maxDayOffset)? Theme.PRIMARY_FOREGROUND: 'black'}
                    disabled={dayOffset >= this.state.maxDayOffset}
                    size={25}
                    containerStyle={{ textAlign: "center", width: 50, height: 50 }}
                    onPress={() => { this.setDayOffset(dayOffset + 1, dayOffset, dateTime, this.props.schedules)}} />
            </View>
            <DateTimePicker
                minimumDate={moment(this.state.nowDate).subtract(-this.state.minDayOffset, 'days').toDate()}
                maximumDate={moment(this.state.nowDate).add(this.state.maxDayOffset, 'days').toDate()}
                isVisible={this.props.showDateTimeModal}
                onConfirm={(selectedDateTime) => { this.onTimeModalSubmit(moment(selectedDateTime), this.props.schedules) }}
                onCancel={() => {
                    this.props.onDateTimeModalClosed();
                }}
                date={dateTime.toDate()}
                mode="datetime"
                />
        </View>);
    }
};
