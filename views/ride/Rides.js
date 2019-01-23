import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import AwsExports from '../../AwsExports';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import distance from 'jaro-winkler';
import RidesParallax from './RidesParallax';
import RidesHeader from './RidesHeader';
import RideFilters from './RideFilters';
import RideFilterHeader from './RideFilterHeader';
import RideList from './RideList';
import Theme from '../../Theme';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';

Amplify.configure(AwsExports);

export default class Rides extends React.Component {
    static navigationOptions = {
        title: 'Rides',
        header: null
    };

    constructor(props) {
        super();

        var testRides = [
            {key: '102002', id: '102002', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102003', id: '102003', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102004', id: '102004', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102005', id: '102005', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102006', id: '102006', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 5, fastPassTime: '3:20 PM', rating: 10, visible: true, selected: false },
            {key: '102007', id: '102007', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102008', id: '102008', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102009', id: '102009', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102010', id: '102010', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102011', id: '102011', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102012', id: '102012', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102013', id: '102013', name: 'Radiator Springs Racers', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102014', id: '102014', name: 'Splash Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM', rating: 5, visible: true, selected: false },
            {key: '102015', id: '102015', name: 'Space Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: null, fastPassTime: null, rating: null, status: 'Closed', visible: true, selected: false }];

        var testParkSchedules = {
            "2018-12-10": [
                {
                    parkName: "Disneyland",
                    openTime: "08:00:00",
                    closeTime: "23:00:00",
                    crowdLevel: 5,
                    date: "2018-12-10",
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
            activeFilters: null,
            selectedFilters: null,
            showFilters: false,
            sortMode: 'Name',
            sortAsc: true,
            //network state
            rides: [],
            filters: testFilters,
            schedules: testParkSchedules,
            weathers: testWeathers,
            refreshing: false
        }

        this.rideMap = {};
    }

    componentWillMount = () => {
        this.refreshRides();
    }

    rideInFilter = (rideID, activeFilters) => {
        if (activeFilters != null) {
            for (var filterID in activeFilters) {
                var filter = this.state.filters[filterID];
                if (filter.rideIDs[rideID] == null) {
                    return false;
                }
            }
        }
        return true;
    }

    //WRAPPERS FOR SORT USED TO IMPROVE PERFORMANCE
    updateSortMode = (sortMode) => {
        this.sort(this.state.rides.splice(), sortMode, this.state.sortAsc, this.state.rideQuery);
    }

    updateSortAsc = (sortAsc) => {
        this.sort(this.state.rides.splice(), this.state.sortAsc, sortAsc, this.state.rideQuery);
    }

    updateRideQuery = (query) => {
        this.sort(this.state.rides.splice(), this.state.sortMode, this.state.sortAsc, query);
    }

    sort = (rides, sortMode, sortAsc, rideQuery) => {
        //Don't sort if user is querying rides
        if (rideQuery != null && rideQuery.length > 0) {
            rides.sort((ride1, ride2) => {
                var dist1 = distance(rideQuery, ride1["name"], { caseSensitive: false });
                var dist2 = distance(rideQuery, ride2["name"], { caseSensitive: false });
                return dist2 - dist1;
            });
            this.setState({
                rideQuery: rideQuery,
                rides: rides,
                sortMode: sortMode,
                sortAsc: sortAsc
            });
            return;
        }
        if (sortMode == 'Name') {
            rides.sort((ride1, ride2) => {
                return (sortAsc)? ride1["name"].localeCompare(ride2["name"]): ride2["name"].localeCompare(ride1["name"])
            });
        } else if (sortMode == 'Rating') {
            rides.sort((ride1, ride2) => {
                var rating1 = (ride1["rating"] != null)? ride1["rating"]: (sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                var rating2 = (ride2["rating"] != null)? ride2["rating"]: (sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                return (!sortAsc)? (rating1 - rating2): (rating2 - rating1);
            });
        } else if (sortMode == "Wait") {
            rides.sort((ride1, ride2) => {
                var wait1 = (ride1["waitMins"] != null)? ride1["waitMins"]: (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                var wait2 = (ride2["waitMins"] != null)? ride2["waitMins"]: (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                return (sortAsc)? (wait1 - wait2): (wait2 - wait1);
            });
        } else if (sortMode == "FastPass") {
            rides.sort((ride1, ride2) => {
                var fp1 = (ride1["fastPassTime"] != null)? moment(ride1["fastPassTime"], 'h:mm A').valueOf(): (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                var fp2 = (ride2["fastPassTime"] != null)? moment(ride2["fastPassTime"], 'h:mm A').valueOf(): (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                return (sortAsc)? (fp1 - fp2): (fp2 - fp1);
            });
        }
        this.setState({
            rides: rides,
            sortMode: sortMode,
            sortAsc: sortAsc,
            rideQuery: null
        });
    }

    setActiveFilters = (activeFilters) => {
        var rides = this.state.rides.slice();
        for (var ride of rides) {
            var rideID = ride.id;
            if (ride.visible != this.rideInFilter(rideID, activeFilters)) {
                ride.visible = !ride.visible;
            }
        }

        this.setState({
            rides: rides,
            activeFilters: activeFilters
        });
    }

    editFilters = (filters) => {
        var selectedRides = {};
        for (var filter of filters) {
            for (var rideID in filter.rideIDs) {
                selectedRides[rideID] = true;
            }
        }
        var filterName = '';
        if (filters.length == 1) {
            filterName = filters[0].filterID;
        }
        this.setSelectedRides(selectedRides);
        this.setState({
            filterName: filterName
        });
    }

    watchFilter = (filterID, notifyConfig) => {
        var filters = this.state.filters;
        var filter = filters[filterID];
        filter["notifyConfig"] = notifyConfig
        this.setState({
            filters: filters
        });

        //TODO: Make save filter request
    }

    unwatchFilter = (filterID) => {
        var filters = this.state.filters;
        var filter = filters[filterID];
        filter["notifyConfig"] = null;
        this.setState({
            filters: filters
        });

        //TODO: Make save filter request
    }

    deleteFilters = (deleteFilters) => {
        var filters = this.state.filters;
        var activeFilters = this.state.activeFilters;
        for (var filter of deleteFilters) {
            if (activeFilters != null) {
                delete activeFilters[filter.filterID];
            }
            delete filters[filter.filterID];
        }
        this.setState({
            filter: filters,
            activeFilters: activeFilters
        });

        //TODO: Make save filter request
    }

    saveFilter = () => {
        var filters = this.state.filters;
        var filter = filters[this.state.filterName];
        if (filter == null) {
            filter = { 
                key: this.state.filterName,
                filterID: this.state.filterName 
            };
            filters[this.state.filterName] = filter;
        }
        filter["rideIDs"] = this.state.selectedRides;
        this.setSelectedRides(null);
        this.setState({
            filters: filters,
            filterName: ''
        });

        //TODO: Make save filter request
    }

    getParkDateForDateTime = (dateTime) => {
        var date = dateTime.clone().subtract(4, 'hours');
        date.set({hour:0,minute:0,second:0,millisecond:0});
        return date;
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

    setSelectedRides = (selectedRides) => {
        var rides = this.state.rides.slice();
        for (var ride of rides) {
            var rideID = ride.id;
            var selected = (selectedRides != null && selectedRides[rideID] != null);
            ride.selected = selected;
        }
        this.setState({
            rides: rides,
            selectedRides: selectedRides
        });
    }

    showRefreshed = () => {
        
    }

    refreshRides = () => {
        var handleRideUpdate = (recvRides) => {
            var rides = this.state.rides.slice();
            for (var recvRide of recvRides) {
                var rideID = recvRide.id;
                var ride = this.rideMap[rideID];
                //New ride added, create new json structure in array and map
                if (ride == null && recvRide.info != null) {
                    //Add fields to track view of ride row
                    ride = { key: rideID, id: rideID };
                    this.rideMap[rideID] = ride;
                    ride["visible"] = this.rideInFilter(rideID, this.state.activeFilters);
                    //Could check if in selectedFilters but might not be desired behavior
                    ride["selected"] = false;
                    Object.assign(ride, recvRide.info);
                    rides.push(ride);
                }
                if (ride != null && recvRide.time != null) {
                    Object.assign(ride, recvRide.time);
                }
            }

            //If rides were added, we must sort again
            if (rides.length != this.state.rides.length) {
                this.sort(rides, this.state.sortMode, this.state.sortAsc, this.state.rideQuery);
            } else {
                this.setState({
                    rides: rides
                });
            }
        }
        var updatePromise = API.graphql(graphqlOperation(mutations.updateRides));
        API.graphql(graphqlOperation(queries.getRides)).then((data) => {
            handleRideUpdate(data.data.getRides);
            updatePromise.then((data) => {
                console.log("UPDATE RESP: ", JSON.stringify(data));
                if (data.data.updateRides != null) {
                    handleRideUpdate(data.data.updateRides.rides);
                }
                this.showRefreshed();
            });
        });
    }

    updateDateTime = (dateTime) => {
        this.setState({
            dateTime: dateTime
        });
    }

    updateFilterName = (name) => {
        this.setState({
            filterName: name
        });
    }

    cancelFilterName = () => {
        this.setSelectedRides(null);
        this.setState({
            filterName: ''
        });
    }

    showFilters = () => {
        this.setState({
            showFilters: true
        });
    }

    hideFilters = () => {
        this.setState({
            showFilters: false
        });
    }

    renderListHeader = () => {
        if (this.state.selectedRides == null) {
            return (<RidesHeader
                schedules={this.state.schedules}
                onRideQueryChanged={ this.updateRideQuery }
                onDateTimeChanged={ this.updateDateTime } />);
        } else {
            return (<RideFilterHeader 
                filterID={this.state.filterName}
                filters={this.state.fitlers}
                onSaveFilter={this.saveFilter}
                onFilterIDChanged={ this.updateFilterName }
                onFilterEditCancelled={ this.cancelFilterName } />)
        }
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
                renderHeader={this.renderListHeader}
                onRefresh={this.refreshRides}>
                    <RideList 
                        rides={this.state.rides}
                        filters={this.state.fitlers}
                        activeFilters={this.state.activeFilters}
                        selectedRides={this.state.selectedRides}
                        onSelectedRidesChanged={this.setSelectedRides} />
                    <View style={{
                        width: "100%",
                        height: (this.state.showFilters)? 300: 0,
                        backgroundColor: Theme.PRIMARY_BACKGROUND
                    }}></View>
            </RidesParallax>
            { (this.state.showFilters)?
                (<RideFilters
                    filters={this.state.filters}
                    activeFilters={this.state.activeFilters}
                    sortMode={this.state.sortMode}
                    sortAsc={this.state.sortAsc}
                    onSortModeChanged={ this.updateSortMode }
                    onSortAscChanged={ this.updateSortAsc }
                    onWatch={this.watchFilter}
                    onUnwatch={this.unwatchFilter}
                    onActiveFiltersChanged={this.setActiveFilters}
                    onEditFilters={this.editFilters}
                    onDeleteFilters={this.deleteFilters}
                    onClose={ this.hideFilters } />): (
                <Icon
                    raised
                    name='filter-list'
                    color={Theme.PRIMARY_FOREGROUND}
                    containerStyle={{ 
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        backgroundColor: Theme.PRIMARY_BACKGROUND }}
                    onPress={ this.showFilters } />)
            }
        </View>);
    }
};
