import React from 'react';
import { StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import Search from 'react-native-search-box';
import moment from 'moment';

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

const theme = {
    Button: {
      titleStyle: {
        color: 'red',
      }
    }  
  };

const actionBackground = "#3B3F44";

const actionForeground = "#DDDDDD";

export default class TimeBar extends React.Component {
    constructor(props) {
        super();

        this.state = {
            timePercent: null
        }
    }

    openRide = (ride) => {

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
        console.log("ON LONG PRESS");
        var selectedRides = this.state.selectedRides;
        if (selectedRides == null) {
            selectedRides = {};
        }
        selectedRides[ride.key] = true;
        this.setState({
            selectedRides: selectedRides
        });
    }

    setFilterName = (filterName) => {
        this.setState({
            filterName: filterName
        });
    }

    scrollTime = (value) => {
        
    }

    searchRides = (query) => {
        this.setState({
            rideQuery: query
        });
    }

    clearRideSearch = (e) => {
        console.log("EVENT: ", e);
        this.setState({
            rideQuery: ""
        });
    }

    getTimePercent = (parkSchedules, date) => {
        var timePercent = 0.5
        if (parkSchedules != null) {
            var times = this.getResortDateTimes(parkSchedules, date);
            if (times != null) {
                var openDateTime = times["openDateTime"];
                var closeDateTime = times["closeDateTime"];
                var now = moment();
                if (openDateTime <= now <= closeDateTime) {
                    var minsOpen = moment.duration(closeDateTime.diff(openDateTime));
                    var minsSinceOpen = moment.duration(now.diff(openDateTime));
                    timePercent = minsSinceOpen / minsOpen;
                }
            }
        }
        return timePercent;
    }

    toggleTimeMachine = (parkSchedules, date) => {
        if (this.state.timePercent == null) {
            var timePercent = this.getTimePercent(parkSchedules, date);
            this.setState({
                timePercent: timePercent,
                dayOffset: 0
            });
        } else {
            this.setState({
                timePercent: null,
                dayOffset: null
            });
        }
    }

    renderHeader = (parkSchedules, date, dateTime) => {
        var clearIcon = (this.state.rideQuery != null && this.state.rideQuery.length > 0)? { name: 'close', style: { width: 30, height: 30, marginLeft: 3, marginTop: -7, fontSize: 30, alignSelf: "center" } }: null;
        return (
        <View style={{ flex: 1, flexDirection: "column" }}>
            <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center' }}>
                <SearchBar 
                    placeholder="Rides"
                    icon={{ name: 'search', style: { fontSize: 25, height: 25, marginTop: -4  } }}
                    clearIcon={clearIcon}
                    value={this.state.rideQuery}
                    containerStyle={{
                        width: "80%",
                        height: 58,
                        backgroundColor: actionBackground,
                        borderBottomColor: "rgba(0, 0, 0, 0.3)",
                        borderBottomWidth: 2,
                        borderTopWidth: 0
                    }}
                    inputStyle={{
                        marginLeft: 15,
                        paddingTop: 0,
                        paddingBottom: 0,
                        fontSize: 22,
                        color: actionForeground
                    }}
                    onChangeText={this.searchRides}
                    onClearText={this.clearRideSearch} />
                <View style={{ 
                    width: "20%", 
                    height: 58, 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignContent: 'center', 
                    backgroundColor: actionBackground,
                    borderBottomColor: "rgba(0, 0, 0, 0.3)",
                    borderBottomWidth: 2 }}>
                    <Icon
                        name={(this.state.timePercent == null)? 'access-time': 'close'}
                        size={40}
                        color={actionForeground}
                        onPress={() => {
                            this.toggleTimeMachine(parkSchedules, date);
                        }} />
                </View>
            </View>
            {
                (this.state.timePercent != null)?
                    (this.renderTimeBar(dateTime)): null
            }
        </View>);
    }

    getDate = (offset) => {
        var date = moment();
        date.subtract(4, 'hours');
        if (offset != null) {
            date.add(offset, 'days');
        }
        date.set({hour:0,minute:0,second:0,millisecond:0});
        return date;
    }

    getResortDateTimes = (parkSchedules, date) => {
        if (parkSchedules != null) {
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
        return null;
    }

    getDateTime = (parkSchedules, date) => {
        if (this.state.timePercent != null) {
            var times = this.getResortDateTimes(parkSchedules, date);
            if (times != null) {
                var openDateTime = times["openDateTime"];
                var closeDateTime = times["closeDateTime"];
                console.log("OPEN DATE TIME: ", openDateTime.format("YYYY-MM-DD HH:mm:ss"));
                console.log("CLOSE DATE TIME: ", closeDateTime.format("YYYY-MM-DD HH:mm:ss"));
                var resortOpenMinutes = (closeDateTime.valueOf() - openDateTime.valueOf()) / (60 * 1000);
                console.log("RESORT OPEN MINUTES: ", resortOpenMinutes, " - ", this.state.timePercent);
                console.log("TIME PERCENT: ", this.state.timePercent);
                var minutes = resortOpenMinutes * this.state.timePercent;
                console.log("MINUTES: ", minutes);
                openDateTime.add(minutes, 'minutes');
                return openDateTime;
            }
        }
        return moment();  //return now
    }

    getParkSchedules = (schedules, scheduleDate) => {
        if (schedules != null) {
            var parkSchedules = [];
            for (var schedule of schedules) {
                var scheduleDateStr = scheduleDate.format('YYYY-MM-DD');
                if (schedule["date"] == scheduleDateStr) {
                    parkSchedules.push(schedule);
                }
            }
            if (parkSchedules.length == 0) {
                return null;
            }
            return parkSchedules;
        }
        return null;
    }

    getWeather = (weathers, dateTime) => {
        var timeStr = dateTime.format("YYYY-MM-DD HH:00:00");
        return weathers[timeStr];
    }
    
    renderTimeBar = (dateTime) => {
        var timeStr = null;
        if (dateTime != null) {
            timeStr = dateTime.format('h:mm A');
        }
        return (<View style={{ width: '100%', flex:1, flexDirection: 'column', justifyContent: 'space-evenly', height: 30, backgroundColor: actionBackground }}>
            { (timeStr != null)?
                (<View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: actionBackground }}>
                    <Icon
                    name="navigate-before" />
                    <View style={{ width: '70%', flexDirection: 'column', alignItems: 'center' }}>
                        <Slider
                            style={{ width: "100%" }}
                            value={this.state.timePercent}
                            onValueChange={(value) => this.setState({timePercent: value})} />
                        <Text>{timeStr}</Text>
                    </View>
                    <Icon
                        name="navigate-next" />
                </View>):
                (<ActivityIndicator size="small" color="#cccccc" />)
            }
        </View>);
    }

    renderScheduleBar = (parkSchedules, weather) => {
        if (weather != null) {
            var temp = weather["feelsLikeF"];
        }
        var dayRating = null;
        if (parkSchedules != null) {
            dayRating = 0;
            for (var parkSchedule of parkSchedules) {
                dayRating += parkSchedule.crowdLevel;
            }
            dayRating /= parkSchedules.length;
        }
        return (<View style={{
            width: '100%', 
            flex: 1, 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center'
        }}>
            { (temp != null)?
                (<View style={{
                    borderTopRightRadius: 20,
                    backgroundColor: actionBackground
                }}>
                    <Text>{temp}</Text>
                </View>): <View />
            }
            { (dayRating != null)?
                (<View style={{
                    borderTopLeftRadius: 20,
                    backgroundColor: actionBackground
                }}>
                    <Text>{dayRating}</Text>
                </View>): <View />
            }
        </View>)
    }

    renderParkInfo = (parkSchedule) => {
        if (parkSchedule != null) {
            var parkName = parkSchedule["parkName"];
            var openTime = moment(parkSchedule["openTime"], 'HH:mm:ss');
            var closeTime = moment(parkSchedule["closeTime"], 'HH:mm:ss');
            var openTimeStr = openTime.format('hh:mm A');
            var closeTimeStr = closeTime.format('hh:mm A');
            return (<View style={{ 
                flex: 1, 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                backgroundColor: 'rgba(30, 30, 30, 0.8)'
            }}>
                <Text>{parkName}</Text>
                <Text>{openTimeStr} - {closeTimeStr}</Text>
            </View>);
        } else {
            return (<ActivityIndicator size="large" color="#cccccc" />);
        }
    }

    renderRide = (ride) => {
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

    render() {
        var date = this.getDate(this.state.dayOffset);
        var parkSchedules = this.getParkSchedules(this.state.schedules, date);
        var dateTime = this.getDateTime(parkSchedules, date);
        console.log("DT: ", dateTime.format("YYYY-MM-DD HH:mm:ss"));
        var headerHeight = 358;
        var stickyHeaderHeight = 80;
        if (this.state.timePercent != null) {
            stickyHeaderHeight += 30;
        }
        return (
        <View style={{ width: "100%", height: "100%" }}>
            <ParallaxScrollView
                ref='_scrollView'
                refreshControl={
                    <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this._onRefresh}
                    />
                }
                backgroundColor={actionBackground}
                contentBackgroundColor="#404040"
                parallaxHeaderHeight={headerHeight}
                parallaxBackgroundScrollSpeed={30}
                stickyHeaderHeight={stickyHeaderHeight}
                fadeOutForeground={false}
                renderFixedHeader={() => { return this.renderHeader(parkSchedules, date, dateTime) }} 
                renderBackground={() => (
                    <Image style={{"width": "100%", "height": 350, "marginTop": 58}} source={require('../../assets/castle.jpg')}></Image>
                )}
                renderForeground={() => (
                    <View style={{width: "100%", height: 300}}>

                    </View>
                )}>
                    <ImageCacheProvider>
                        <FlatList
                            data={[
                                {key: '102002', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102003', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102004', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102005', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102006', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102007', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102008', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102009', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102010', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102011', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102012', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102013', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102014', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' },
                                {key: '102015', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' }]}
                            renderItem={({item}) => this.renderRide(item)} />
                    </ImageCacheProvider>
            </ParallaxScrollView>
            <Icon
                raised
                name='filter-list'
                color={actionForeground}
                containerStyle={{ 
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    backgroundColor: actionBackground }}
                onPress={() => console.log('hello')} />
        </View>);
    }
};
