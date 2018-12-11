import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import AwsExports from '../../AwsExports';
import Amplify, { Auth } from 'aws-amplify';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import RidesParallax from './RidesParallax';
import RidesHeader from './RidesHeader';

Amplify.configure(AwsExports);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    card: {
        width: "100%", 
        flex: 1, 
        flexDirection:'row', 
        justifyContent: 'flex-start',
        backgroundColor: '#449944',
        padding: 5,
        borderRadius: 5,
        borderWidth: 3,
        borderColor: '#333333'
    }
});

const actionBackground = "#3B3F44";
const actionForeground = "#DDDDDD";

export default class RideList extends React.Component {
    static navigationOptions = {
        title: 'RideList',
        header: null
    };

    constructor(props) {
        super();

        var testParkSchedules = {
            "2018-12-10": [
                {
                    parkName: "Disneyland",
                    openTime: "08:00:00",
                    closeTime: "23:00:00",
                    crowdLevel: 5,
                    date: "2018-12-10"
                },
                {
                    parkName: "California Adventures",
                    openTime: "08:00:00",
                    closeTime: "23:00:00",
                    crowdLevel: 4,
                    date: "2018-12-10"
                }
            ],
            "2018-12-11": [
                {
                    parkName: "Disneyland",
                    openTime: "09:00:00",
                    closeTime: "00:00:00",
                    crowdLevel: 7,
                    date: "2018-12-11"
                },
                {
                    parkName: "California Adventures",
                    openTime: "10:00:00",
                    closeTime: "20:00:00",
                    crowdLevel: 10,
                    date: "2018-12-11"
                }
            ]
        }

        var testWeathers = {
            "2018-12-08 12:00:00": {
                feelsLikeF: 72
            },
            "2018-12-08 13:00:00": {
                feelsLikeF: 72
            },
            "2018-12-08 14:00:00": {
                feelsLikeF: 77
            },
            "2018-12-08 15:00:00": {
                feelsLikeF: 100
            }
        };

        var testFilters = {
            "favorites": {
                key: "favorites",
                filterID: "favorites",
                rideIDs: { "102002": true, "14141": true }
            }
        }

        this.state = {
            dateTime: null,
            selectedRides: null,
            rideQuery: "",
            filterName: "",
            filters: testFilters,
            activeFilters: null,
            selectedFilters: null,
            showFilters: false,
            sortMode: 'Name',
            sortAsc: true,
            timePercent: null,
            dayOffset: null,
            //network state
            schedules: testParkSchedules,
            weathers: testWeathers,
            parkInfoI: 0,
            showTimeModal: false,
            dayOffsetMin: 0,
            dayOffsetMax: 1,
            numParks: 2,
            watchFilterID: null,
            showWatchFastPassModal: false,
            refreshing: false,
            watchRating: '',
            watchWait: '',
            watchFastPass: ''
        }
    }

    showCalendar = () => {

    }

    setDayOffset = (offset, dateTime) => {
        if (offset >= this.state.dayOffsetMin && offset <= this.state.dayOffsetMax) {
            var newDate = this.getDate(offset);
            var newDateTime = dateTime.clone();
            newDateTime.add(offset - this.state.dayOffset, 'days');
            var parkSchedules = this.getParkSchedules(this.state.schedules, newDate);
            var timePercent = this.getTimePercent(parkSchedules, newDate, newDateTime);
            this.setState({
                dayOffset: offset,
                timePercent: timePercent
            });
        }
    }

    setParkInfoI = (infoI) => {
        this.setState({
            parkInfoI: infoI
        })
    }

    onTimeModalSubmit = (currentMoment, selectedDateTime) => {
        var selectedDate = selectedDateTime.clone();
        selectedDate.subtract(4, 'hours');
        var dayDiff = selectedDate.diff(currentMoment, 'days');
        var parkSchedules = this.getParkSchedules(this.state.schedules, selectedDate);
        var timePercent = this.getTimePercent(parkSchedules, selectedDate, selectedDateTime);
        this.setState({
            dayOffset: dayDiff,
            timePercent: timePercent,
            showTimeModal: false
        });
    }

    onTimeModalClose = () => {
        this.setState({
            showTimeModal: false
        });
    }

    openRide = (ride) => {

    }

    onRefresh = () => {

    }

    onRidePressed = (ride) => {
        if (this.state.selectedRides == null) {
            this.openRide(ride);
        } else {
            var selectedRides = this.state.selectedRides;
            if (selectedRides[ride.key] != null) {
                delete selectedRides[ride.key];
            } else {
                selectedRides[ride.key] = true;
            }
            if (Object.keys(selectedRides).length == 0) {
                selectedRides = null;
            }
            this.setState({
                selectedRides: selectedRides
            });
        }
    }
    
    onRideLongPressed = (ride) => {
        var selectedRides = this.state.selectedRides;
        if (selectedRides == null) {
            selectedRides = {};
        }
        selectedRides[ride.key] = true;
        this.setState({
            selectedRides: selectedRides
        });
    }

    onFilterPressed = (filter) => {
        if (this.state.selectedFilters == null) {
            var activeFilters = this.state.activeFilters;
            if (activeFilters == null) {
                activeFilters = {};
            }
            if (activeFilters[filter.filterID] == null) {
                activeFilters[filter.filterID] = true;
            } else {
                delete activeFilters[filter.filterID];
            }
            if (Object.keys(activeFilters).length == 0) {
                activeFilters = null;
            }
            this.setState({
                activeFilters: activeFilters
            });
        } else {
            var selectedFilters = this.state.selectedFilters;
            if (selectedFilters[filter.filterID] == null) {
                selectedFilters[filter.filterID] = true;
            } else {
                delete selectedFilters[filter.filterID];
            }
            if (Object.keys(selectedFilters).length == 0) {
                selectedFilters = null;
            }
            this.setState({
                selectedFilters: selectedFilters
            });
        }
    }

    onFilterLongPressed = (filter) => {
        var selectedFilters = this.state.selectedFilters;
        if (selectedFilters == null) {
            selectedFilters = {};
        }
        selectedFilters[filter.filterID] = true;
        this.setState({
            selectedFilters: selectedFilters
        });
    }

    onEditFilter = (filter) => {
        var selectedRides = {};
        for (var rideID in filter.rideIDs) {
            selectedRides[rideID] = true;
        }
        this.setState({
            filterName: filter.filterID,
            selectedRides: selectedRides,
            selectedFilters: null
        });
    }

    onEditWatch = (filter) => {
        getNotifyConfigValue = (notifyConfig, key) => {
            return (notifyConfig != null && notifyConfig[key] != null)? (notifyConfig[key]).toString(): ''
        }
        var watchFastPass = getNotifyConfigValue(filter.notifyConfig, 'fastPassTime');
        console.log("FP LOAD: ", watchFastPass);
        if (watchFastPass.length > 0) {
            watchFastPass = moment(watchFastPass, 'HH:mm:ss').format('h:mm A');
        }
        this.setState({
            watchFilterID: filter.filterID,
            watchRating: getNotifyConfigValue(filter.notifyConfig, 'waitRating'),
            watchWait: getNotifyConfigValue(filter.notifyConfig, 'waitTime'),
            watchFastPass: watchFastPass
        });
    }

    onWatch = (watchFilter) => {
        var filters = this.state.filters;
        var filter = filters[watchFilter.filterID];
        var fastPassTime = (this.state.watchFastPass.length > 0)? moment(this.state.watchFastPass, 'h:mm A').format('HH:mm:ss'): null;
        console.log("FASTPASSTIME: ", fastPassTime);
        filter["notifyConfig"] = {
            waitRating: (this.state.watchRating.length > 0)? this.state.watchRating: null,
            waitTime: (this.state.watchWait.length > 0)? this.state.watchWait: null,
            fastPassTime: fastPassTime
        };
        this.setState({
            filters: filters,
            watchRating: '',
            watchWait: '',
            watchFastPass: '',
            watchFilterID: null
        });
    }

    onUnwatch = (unwatchFilter) => {
        var filters = this.state.filters;
        var filter = filters[unwatchFilter.filterID];
        filter["notifyConfig"] = null;
        this.setState({
            filters: filters,
            watchRating: '',
            watchWait: '',
            watchFastPass: '',
            watchFilterID: null
        });
    }

    onMergeFilters = (filters) => {
        var selectedRides = {};
        for (var filter of filters) {
            for (var rideID in filter.rideIDs) {
                selectedRides[rideID] = true;
            }
        }
        this.setState({
            selectedRides: selectedRides,
            selectedFilters: null
        });
    }

    onDeleteFilters = (filters) => {
        var activeFilters = this.state.activeFilters;
        var filters = this.state.filters;
        for (var filter of filters) {
            delete activeFilters[filter.filterID];
            delete filters[filter.filterID];
        }
        this.setState({
            filter: filters,
            activeFilters: activeFilters,
            selectedFilters: null
        });

        this.deleteFilter(filters);
    }

    onSaveFilter = () => {
        var filters = this.state.filters;
        var filter = filters[this.state.filterName];
        if (filter == null) {
            filter = { 
                key: this.state.filterName,
                filterID: this.state.filterName 
            };
            filters[this.state.filterName] = filter;
        }
        filter["rideIDs"] = selectedRides;
        this.setState({
            filters: filters,
            selectedRides: null,
            filterName: ''
        });

        this.saveFilter(filter);
    }

    watchFilter = (filter) => {

    }

    saveFilter = (filter) => {

    }

    //TODO: Make mutation to delete filter
    deleteFilter = (filters) => {

    }

    setFilterName = (filterName) => {
        this.setState({
            filterName: filterName
        });
    }

    searchRides = (query) => {
        this.setState({
            rideQuery: query
        });
    }

    getParkSchedules = (schedules, scheduleDate) => {
        if (schedules != null) {
            var parkSchedules = schedules[scheduleDate.format('YYYY-MM-DD')];
            return parkSchedules;
        }
        return null;
    }

    getWeather = (weathers, dateTime) => {
        if (weathers != null) {
            var timeStr = dateTime.format("YYYY-MM-DD HH:00:00");
            return weathers[timeStr];
        }
        return null;
    }
    
    rideInFilter = (rideID) => {
        if (this.state.activeFilters != null) {
            console.log("ACTIVE FILTERS: ", this.state.activeFilters, " - ", rideID);
            for (var filterID in this.state.activeFilters) {
                var filter = this.state.filters[filterID];
                console.log("FILTER: ", filter);
                if (filter.rideIDs[rideID] == null) {
                    return false;
                }
            }
        }
        return true;
    }

    renderRide = (ride) => {
        if (!this.rideInFilter(ride.id)) {
            return null;
        }
        var fontSize = 18;
        var cardStyle = Object.assign({}, styles.card);
        if (this.state.selectedRides != null && this.state.selectedRides[ride.key] != null) {
            cardStyle.backgroundColor = "#0080ff";
        }
        return (
            <TouchableOpacity
                onPress={() => { this.onRidePressed(ride) }}
                onLongPress={() => { this.onRideLongPressed(ride) }}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <CachedImage style={{ width: 60, height: 60, borderRadius: 30 }} source={{uri: ride.img}}/>
                    { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                    {ride.name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize }}>
                                    {ride.waitMins}
                                </Text>
                            </View>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                    {ride.fastPassTime}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    renderFilter = (filter) => {
        var cardStyle = Object.assign({}, styles.card);
        if (this.state.selectedFilters != null && this.state.selectedFilters[filter.filterID] != null) {
            cardStyle.backgroundColor = "#0080FF";
        } else if (this.state.activeFilters != null && this.state.activeFilters[filter.filterID] != null) {
            cardStyle.backgroundColor = "#00BB00"
        } else {
            cardStyle.backgroundColor = "grey";
        }
        if (filter["notifyConfig"] != null) {
            cardStyle.borderColor = "#DDDDDD";
        }
        return (<TouchableOpacity
            onPress={() => { this.onFilterPressed(filter) }}
            onLongPress={() => { this.onFilterLongPressed(filter) }}>
            <View 
                elevation={10} 
                style={cardStyle}>
                <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }}>
                    <Text style={{ color: actionForeground, fontSize: 25 }}>{filter.filterID}</Text>
                    <View style={{ position: 'absolute', top: 0, right: 0, flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center', color: actionForeground }}>
                        <Icon
                            name="edit"
                            color={actionForeground}
                            size={25}
                            containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "#333333", padding: 10, borderWidth: 2, marginTop: -8, marginRight: 20 }} 
                            onPress={() => { this.onEditFilter(filter) }} />
                        <Icon
                            name={ 'visibility' }
                            color={actionForeground}
                            size={25}
                            containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "#333333", padding: 10, marginTop: -8, borderWidth: 2 }}
                            onPress={() => { 
                                this.onEditWatch(filter);
                            }} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>);
    }

    //CANNON
    getParkDateForDateTime = (dateTime) => {
        var date = dateTime.clone().subtract(4, 'hours');
        date.set({hour:0,minute:0,second:0,millisecond:0});
        return date;
    }

    refreshRides = () => {

    }

    searchRides = (rideQuery) => {

    }

    updateDateTime = (dateTime) => {
        this.setState({
            dateTime: dateTime
        });
    }

    render() {
        var dateTime = this.state.dateTime;
        if (dateTime == null) {
            dateTime = moment();
        }
        var date = this.getParkDateForDateTime(dateTime);
        var parkSchedules = this.getParkSchedules(this.state.schedules, date);
        var weather = this.getWeather(this.state.weathers, dateTime);
        return (
        <View style={{ width: "100%", height: "100%" }}>
            <RidesParallax
                parkSchedules={parkSchedules}
                weather={weather}
                refreshing={this.state.refreshing}
                renderHeader={() => {
                    return <RidesHeader
                        schedules={this.state.schedules}
                        onRideQueryChanged={this.searchRides}
                        onDateTimeChanged={this.updateDateTime} />
                }}
                onRefresh={this.refreshRides}>
                    <ImageCacheProvider>
                        <FlatList
                            data={[
                                {key: '102002', id: '102002', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102003', id: '102003', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102004', id: '102004', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102005', id: '102005', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102006', id: '102006', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102007', id: '102007', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102008', id: '102008', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102009', id: '102009', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102010', id: '102010', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102011', id: '102011', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102012', id: '102012', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102013', id: '102013', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102014', id: '102014', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102015', id: '102015', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' }]}
                            renderItem={({item}) => this.renderRide(item)} />
                    </ImageCacheProvider>
                    <View style={{
                        width: "100%",
                        height: (this.state.showFilters)? 300: 0,
                        backgroundColor: actionBackground
                    }}></View>
            </RidesParallax>
            { (this.state.showFilters)?
                (<View style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: "40%",
                    flex: 1, 
                    flexDirection: 'column', 
                    justifyContent: 'flex-start', 
                    alignContent: 'center',
                    backgroundColor: actionBackground
                }}>
                    <Text style={{ color: actionForeground, textAlign: 'center', fontSize: 30, marginTop: 5 }}>Order</Text>
                    <View style={{ height: 40 }}>
                        <View style={{ 
                            width: "100%", 
                            flex: 1, 
                            flexDirection: 'row', 
                            justifyContent: 'space-evenly', 
                            alignContent: 'center' }}>
                            <Picker
                                style={{ color: actionForeground, width: 160, height: 40 }}
                                selectedValue={this.state.sortMode}
                                onValueChange={(itemValue, itemIndex) => { this.setState({ sortMode: itemValue }) }}>
                                <Picker.Item label="Name" value="Name" />
                                <Picker.Item label="Rating" value="Rating" />
                                <Picker.Item label="Wait Time" value="Wait" />
                                <Picker.Item label="FastPass" value="FastPass" />
                                <Picker.Item label="Distance" value="Distance" />
                            </Picker>
                            <Switch
                                style={{ width: 50, height: 40, color: actionForeground }}
                                thumbColor={actionForeground}
                                value={this.state.sortAsc} 
                                onValueChange={(value) => { 
                                    this.setState({ sortAsc: value }) 
                                }} />
                        </View>
                    </View>
                    <Text style={{ color: actionForeground, textAlign: 'center', fontSize: 30 }}>Filters</Text>
                    {
                        (this.state.filters != null)? (
                            <FlatList style={{
                                    width: "100%"
                                }}
                                data={ Object.values(this.state.filters) }
                                renderItem={({item}) => this.renderFilter(item)}></FlatList>
                        ): <ActivityIndicator size="small" color="#cccccc" />
                    }
                    <Icon
                        containerStyle={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, textAlign: 'center' }}
                        name={'close'}
                        size={40}
                        color={actionForeground}
                        onPress={() => { 
                            this.setState({ showFilters: false });
                        }} />
                    { (this.state.selectedFilters != null)? (
                        <View style={{ height: 70 }}>
                            <View style={{ 
                                width: "100%", 
                                flex: 1, 
                                flexDirection: 'row', 
                                justifyContent: 'space-evenly', 
                                alignContent: 'center' }}>
                                <Icon
                                    raised
                                    name='close'
                                    color='#0080FF'
                                    containerStyle={{ backgroundColor: "#222222" }}
                                    onPress={() => { this.setState({ selectedFilters: null }) }} />
                                <Icon
                                    raised
                                    name={ (Object.keys(this.state.selectedFilters).length > 1)? 'call-merge': 'edit' }
                                    color='#0080FF'
                                    containerStyle={{ backgroundColor: "#222222" }}
                                    onPress={() => {
                                        var selectedFilterIDArr = Object.keys(this.state.selectedFilters);
                                        if (selectedFilterIDArr.length > 1) {
                                            var filters = [];
                                            for (var filterID of selectedFilterIDArr) {
                                                filters.push(this.state.filters[filterID]);
                                            }
                                            this.onMergeFilters(filters);
                                        } else {
                                            var filter = this.state.filters[selectedFilterIDArr[0]];
                                            this.onEditFilter(filter);
                                        }
                                    }} />
                                <Icon
                                    raised
                                    name='delete'
                                    color='#0080FF'
                                    containerStyle={{ backgroundColor: "#222222" }}
                                    onPress={() => { 
                                        var selectedFilterIDArr = Object.keys(this.state.selectedFilters);
                                        var filters = [];
                                        for (var filterID of selectedFilterIDArr) {
                                            filters.push(this.state.filters[filterID]);
                                        }
                                        this.onDeleteFilters(filters);
                                    }} />
                            </View>
                        </View>): null
                    }
                </View>): (
                <Icon
                    raised
                    name='filter-list'
                    color={actionForeground}
                    containerStyle={{ 
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        backgroundColor: actionBackground }}
                    onPress={() => { this.setState({ showFilters: true }) }} />)
            }
            {
                (this.state.timePercent != null)? (
                    <DateTimePicker
                        minimumDate={moment(date).subtract(-this.state.dayOffsetMin, 'days').toDate()}
                        maximumDate={moment(date).add(this.state.dayOffsetMax, 'days').toDate()}
                        isVisible={this.state.showTimeModal}
                        onConfirm={(selectedDate) => { this.onTimeModalSubmit(this.getDate(0), moment(selectedDate)) }}
                        onCancel={this.onTimeModalClose}
                        date={dateTime.toDate()}
                        mode="datetime"
                        />
                ): null
            }
            {
                (this.state.showFilters)? (
                    <View>
                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={this.state.watchFilterID != null}
                            onRequestClose={() => {
                                this.setState({
                                    watchFilterID: null
                                });
                            }}>
                            <TouchableOpacity style={{
                                flex: 1,
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)'
                            }}
                            onPress={() => { this.setState({ watchFilterID: null }) }}>
                                <TouchableWithoutFeedback>
                                    <View style={{
                                        width: "80%",
                                        height: 500,
                                        paddingTop: 10,
                                        paddingLeft: 30,
                                        paddingRight: 30,
                                        paddingBottom: 30,
                                        borderRadius: 20,
                                        borderWidth: 2,
                                        borderColor: 'rgba(0, 0, 0, 0.3)',
                                        backgroundColor: actionBackground
                                    }}>
                                        <Text style={{
                                            color: actionForeground,
                                            fontSize: 35,
                                            textAlign: 'center'
                                        }}>{this.state.watchFilterID}</Text>
                                        
                                        <Text style={{ color: (this.state.watchRating.length > 0)? actionForeground: 'black', fontSize: 25 }}>Rating</Text>
                                        <TextInput
                                            style={{
                                                color: actionForeground,
                                                backgroundColor: '#222222',
                                                fontSize: 20
                                            }}
                                            keyboardType='numeric'
                                            value={this.state.watchRating}
                                            onChangeText={(value) => { this.setState({ watchRating: value }); }} />
                                            
                                        <Text style={{ color: (this.state.watchWait.length > 0)? actionForeground: 'black', fontSize: 25 }}>Wait Time</Text>
                                        <TextInput
                                            style={{
                                                color: actionForeground,
                                                backgroundColor: '#222222',
                                                fontSize: 20
                                            }}
                                            keyboardType='numeric'
                                            value={this.state.watchWait}
                                            onChangeText={(value) => { this.setState({ watchWait: value.toString() }) }} />

                                        <Text style={{ color: (this.state.watchFastPass.length > 0)? actionForeground: 'black', fontSize: 25 }}>FastPass</Text>
                                        <View>
                                            <Text
                                                style={{
                                                    color: actionForeground,
                                                    backgroundColor: '#222222',
                                                    fontSize: 20,
                                                    width: "100%",
                                                    paddingTop: 13,
                                                    paddingLeft: 5,
                                                    height: 50
                                                }}
                                                onPress={() => {
                                                    this.setState({
                                                        showWatchFastPassModal: true
                                                    })
                                                }}>
                                                {this.state.watchFastPass}
                                            </Text>
                                            {
                                                (this.state.watchFastPass.length > 0)?
                                                (<Icon
                                                    name="close"
                                                    color={actionForeground}
                                                    size={40}
                                                    containerStyle={{ position: 'absolute', right: 0, bottom: 3 }} 
                                                    onPress={() => { this.setState({
                                                        watchFastPass: ''
                                                    }) }} />): null
                                            }
                                        </View>
                                        <View style={{
                                            width: "100%",
                                            flex: 1,
                                            flexDirection: 'row',
                                            justifyContent: 'space-evenly',
                                            alignItems: 'center'
                                        }}>
                                            {
                                                (this.state.watchFilterID != null && this.state.filters[this.state.watchFilterID]["notifyConfig"] != null)? (
                                                    <Icon
                                                        raised
                                                        name='visibility-off'
                                                        color='#FF8000'
                                                        containerStyle={{ backgroundColor: "#222222" }}
                                                        onPress={() => {
                                                            var filter = this.state.filters[this.state.watchFilterID];
                                                            this.onUnwatch(filter);
                                                        }} />
                                                ): null
                                            }
                                            <Icon
                                                raised
                                                name='visibility'
                                                color={(this.state.watchRating.length != 0 || this.state.watchWait.length != 0 || this.state.watchFastPass.length != 0)? '#00BB80': 'black'}
                                                containerStyle={{ backgroundColor: "#222222" }}
                                                disabled={(this.state.watchRating.length == 0 && this.state.watchWait.length == 0 && this.state.watchFastPass.length == 0)}
                                                onPress={() => {
                                                    var filter = this.state.filters[this.state.watchFilterID];
                                                    this.onWatch(filter);
                                                }} />
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </TouchableOpacity>
                        </Modal>
                        <DateTimePicker
                            isVisible={this.state.showWatchFastPassModal}
                            onConfirm={(selectedTime) => { this.setState({ watchFastPass: moment(selectedTime).format('h:mm A'), showWatchFastPassModal: false }) }}
                            onCancel={() => { this.setState({ showWatchFastPassModal: false }) }}
                            mode="time"
                            />
                    </View>
                ): null
            }
        </View>);
    }
};
