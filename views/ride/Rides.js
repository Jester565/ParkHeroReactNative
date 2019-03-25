import React from 'react';
import { AsyncStorage, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import AwsExports from '../../AwsExports';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import distance from 'jaro-winkler';
import RidesParallax from './RidesParallax';
import RidesHeader from './RidesHeader';
import RideFilters from './RideFilters';
import RideFilterHeader from './RideFilterHeader';
import RideList from './RideList';
import PassList from '../pass/PassList';
import Theme from '../../Theme';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import NetManager from '../../NetManager';
import Collapsible from 'react-native-collapsible';

Amplify.configure(AwsExports);

var S3_URL = 'https://s3-us-west-2.amazonaws.com/disneyapp3/';

export default class Rides extends React.Component {
    static navigationOptions = {
        title: 'Rides',
        header: null
    };

    constructor() {
        super();

        //Maps ride id to object stored in the rides array
        this.rideMap = {};
        //Maps datetime to promises so the same request isn't made multiple times (appsync do this?)
        this.refreshWeatherPromises = {};

        this.signedUrls = {};
        this.signPromises = {};

        this.rideDPsPromises = {};
        this.rideDPs = {};

        this.state = {
            mode: 'ride',  //Can be ride or events
            dateTime: null,
            selectedAttractions: null,
            rideQuery: "",
            filterName: "",
            activeRideFilters: null,
            showFilters: false,
            sortMode: 'Name',
            sortAsc: true,
            //network state
            rides: [],
            events: [],
            rideFilters: [],
            schedules: {},
            weathers: {},
            friendPasses: null,
            cangoPasses: null,
            refreshing: false,
            parkI: 0,
            isPassCollapsed: true
        }
    }

    componentWillMount() {
        this.rideCachePromise = this.loadRideCache();
        this.scheduleCachePromise = this.loadScheduleCache();
        this.netSubToken = NetManager.subscribe(this.handleNet);
    }

    loadRideCache = () => {
        return new Promise(async (resolve, reject) => {
            var getParsedItem = async (key) => {
                try {
                    var result = await AsyncStorage.getItem(key);
                    if (result != null) {
                        return JSON.parse(result);
                    }
                } catch (e) {
                    return null;
                }
            }
            var promises = [
                getParsedItem('rideMap'), 
                getParsedItem('sortMode'), 
                getParsedItem('sortAsc'), 
                getParsedItem('rideFilters'),
                getParsedItem('activeRideFilters'),
                getParsedItem('lastRefresh')];
            
            var results = await Promise.all(promises);
            var rideMap = results[0];
            var sortMode = results[1];
            var sortAsc = results[2];
            var rideFilters = results[3];
            var activeRideFilters = results[4];
            var lastRefresh = results[5];
    
            var newState = {};
            if (sortMode != null) {
                newState["sortMode"] = sortMode;
            }
            if (sortAsc != null) {
                newState["sortAsc"] = sortAsc;
            }
            if (rideFilters != null) {
                newState["rideFilters"] = rideFilters;
            }
            if (activeRideFilters != null) {
                newState["activeRideFilters"] = activeRideFilters;
            }
            if (lastRefresh != null) {
                newState["lastRefresh"] = lastRefresh;
            }

            if (rideMap != null) {
                var rides = [];
                for (var rideID in rideMap) {
                    var ride = rideMap[rideID];
                    ride.visible = this.attractionInFilter(rideID, 
                        (activeRideFilters)? activeRideFilters: this.state.activeRideFilters, 
                        (rideFilters)? rideFilters: this.state.rideFilters);
                    ride.selected = false;
                    ride.signedPicUrl = S3_URL + ride["picUrl"] + '-1.webp';
                    rides.push(ride);
                } 
                this.rideMap = rideMap;
                this.sort(rides, (this.state.sortMode)? sortMode: this.state.sortMode, (this.state.sortAsc)? sortAsc: this.state.sortAsc, null);
            }
            if (Object.keys(newState).length > 0) {
                this.setState(newState, () => {
                    this.rideCachePromise = null;
                });
            } else {
                this.rideCachePromise = null;
            }
            resolve(newState);
        });
    }

    loadScheduleCache = () => {
        return new Promise(async (resolve, reject) => {
            var schedulesStr = await AsyncStorage.getItem("schedules");
            if (schedulesStr != null) {
                var schedules = JSON.parse(schedulesStr);
                this.setState({
                    schedules: schedules
                }, () => {
                    this.scheduleCachePromise = null;
                });
            } else {
                this.scheduleCachePromise = null;
            }
            resolve(schedules);
        });
    };

    componentWillUnmount() {
        NetManager.unsubscribe(this.netSubToken);
    }

    handleNet = (event) => {
        if (event == "netSignIn") {
            this.refreshAll();
        }
    }

    refreshAll = () => {
        //TODO: Refresh Rides every load
        //this.refreshRides();
        this.refreshSchedules();
        this.refreshPasses();
        this.refreshWeather(moment());
        this.refreshFilters();
    }

    getSignedUrl = (rideID, url, sizeI) => {
        var key = url + '-' + sizeI.toString() + '.webp';
        if (this.signPromises[key] != null) {
            return this.signedUrls[key];
        }
        var getPromise = Storage.get(key, { 
            level: 'public',
            customPrefix: {
                public: ''
        }});
        this.signPromises[key] = getPromise;
        getPromise.then((signedUrl) => {
            console.log("GOT SIGNED URL: ", signedUrl);
            this.signedUrls[key] = signedUrl;
            var rides = this.state.rides.slice();
            var ride = this.rideMap[rideID];
            ride.signedPicUrl = signedUrl;
            this.setState({
                rides: rides
            });
        });
    }

    attractionInFilter = (attractionID, activeFilters, filters) => {
        if (activeFilters != null) {
            for (var filterID in activeFilters) {
                var filter = filters[filterID];
                if (filter.attractionIDs[attractionID] == null) {
                    return false;
                }
            }
        }
        return true;
    }

    //WRAPPERS FOR SORT USED TO IMPROVE PERFORMANCE
    updateSortMode = (sortMode) => {
        this.sort(this.state.rides.slice(), sortMode, this.state.sortAsc, this.state.rideQuery);
    }

    updateSortAsc = (sortAsc) => {
        this.sort(this.state.rides.slice(), this.state.sortMode, sortAsc, this.state.rideQuery);
    }

    updateRideQuery = (query) => {
        this.sort(this.state.rides.slice(), this.state.sortMode, this.state.sortAsc, query);
    }

    sort = (rides, sortMode, sortAsc, rideQuery) => {
        AsyncStorage.setItem("sortMode", JSON.stringify(sortMode));
        AsyncStorage.setItem("sortAsc", JSON.stringify(sortAsc));
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
                var rating1 = (ride1["waitRating"] != null)? ride1["waitRating"]: (sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                var rating2 = (ride2["waitRating"] != null)? ride2["waitRating"]: (sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                return (!sortAsc)? (rating1 - rating2): (rating2 - rating1);
            });
        } else if (sortMode == "Wait") {
            rides.sort((ride1, ride2) => {
                var wait1 = (ride1["waitTime"] != null)? ride1["waitTime"]: (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
                var wait2 = (ride2["waitTime"] != null)? ride2["waitTime"]: (!sortAsc)? -1: Number.MAX_SAFE_INTEGER;
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

    setActiveRideFilters = (activeFilters) => {
        var rides = this.filterAttractions(activeFilters, this.state.rideFilters, this.state.rides);
        AsyncStorage.setItem("activeRideFilters", JSON.stringify(activeFilters));

        this.setState({
            "rides": rides,
            "activeRideFilters": activeFilters
        });
    }

    filterAttractions = (activeFilters, filters, arr) => {
        var attractions = arr.slice();
        for (var attraction of attractions) {
            var attractionID = attraction.id;
            if (attraction.visible != this.attractionInFilter(attractionID, activeFilters, filters)) {
                attraction.visible = !attraction.visible;
            }
        }
        return attractions;
    }

    editFilters = (filters) => {
        var selectedAttractions = {};
        for (var filter of filters) {
            for (var attractionID in filter.attractionIDs) {
                selectedAttractions[attractionID] = true;
            }
        }
        var filterName = '';
        if (filters.length == 1) {
            filterName = filters[0].filterID;
        }
        if (this.state.mode == 'ride') {
            this.setSelectedRides(selectedAttractions);
        } else {
            this.setSelectedEvents(selectedAttractions);
        }
        this.setState({
            filterName: filterName
        });
    }

    watchRideFilter = (filterID, notifyConfig) => {
        var filters = Object.assign({}, this.state.rideFilters);
        var filter = filters[filterID];
        filter["notifyConfig"] = notifyConfig
        this.setState({
            rideFilters: filters
        });

        AsyncStorage.setItem("rideFilters", JSON.stringify(filters));

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            attractionIDs: Object.keys(filter.attractionIDs),
            watchConfig: notifyConfig,
            filterType: 'ride'
        })).then((data) => {
            console.log("WATCHED FILTER"); 
        });
    }

    unwatchRideFilter = (filterID) => {
        var filters = Object.assign({}, this.state.rideFilters);
        var filter = filters[filterID];
        filter["notifyConfig"] = null;
        this.setState({
            rideFilters: filters
        });

        AsyncStorage.setItem("rideFilters", JSON.stringify(filters));

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            attractionIDs: Object.keys(filter.attractionIDs),
            watchConfig: null,
            filterType: 'ride'
        })).then((data) => {
            console.log("UNWATCH FILTER"); 
        });
    }

    deleteRideFilters = (deleteFilters) => {
        var result = this.deleteFilters(deleteFilters, this.state.rideFilters, this.state.activeRideFilters, 'ride');
        var rideFilters = result["filters"];
        var activeRideFilters = result["activeFilters"];
        AsyncStorage.setItem("rideFilters", JSON.stringify(rideFilters));
        AsyncStorage.setItem("activeRideFilters", JSON.stringify(activeRideFilters));
        this.setState({
            rideFilters: rideFilters,
            activeRideFilters: activeRideFilters
        });
    }

    deleteFilters = (deleteFilters, filters, activeFilters, type) => {
        var newFilters = Object.assign({}, filters);
        var filterNames = [];
        for (var filter of deleteFilters) {
            filterNames.push(filter.filterID);
            if (activeFilters != null) {
                delete activeFilters[filter.filterID];
            }
            delete newFilters[filter.filterID];
        }

        API.graphql(graphqlOperation(mutations.deleteFilters, { filterNames: filterNames, filterType: type })).then((data) => {
            console.log("DELETE FILTERS"); 
        });
        return {
            filters: newFilters,
            activeFilters: activeFilters
        };
    }

    saveRideFilter = () => {
        var rideFilters = this.saveFilter(this.state.rideFilters, 'ride');
        AsyncStorage.setItem("rideFilters", JSON.stringify(rideFilters));

        this.setState({
            rideFilters: rideFilters,
            filterName: ''
        });

        this.setSelectedRides(null);
    }

    saveFilter = (filters, type) => {
        var newFilters = Object.assign({}, filters);
        var filter = filters[this.state.filterName];
        if (filter == null) {
            filter = { 
                key: this.state.filterName,
                filterID: this.state.filterName,
                type: type
            };
            newFilters[this.state.filterName] = filter;
        }
        filter["attractionIDs"] = this.state.selectedAttractions;

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            attractionIDs: Object.keys(filter.attractionIDs),
            watchConfig: filter.notifyConfig,
            filterType: filter.type
        })).then((data) => {
            console.log("UPDATE FILTER"); 
        });

        return newFilters;
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

    //TODO
    setSelectedEvents = (selectedEvents) => {
        var events = this.state.events.slice();
        for (var event of events) {
            var eventID = event.id;
            var selected = (selectedEvents != null && selectedEvents[eventID] != null);
            event.selected= selected;
        }
        this.setState({
            events: events,
            selectedEvents: selectedEvents
        })
    }

    setSelectedRides = (selectedRides) => {
        var rides = this.setSelectedAttractions(selectedRides, this.state.rides);
        this.setState({
            rides: rides,
            selectedAttractions: selectedRides
        });
    }

    setSelectedEvents = (selectedEvents) => {
        var events = this.setSelectedAttractions(selectedEvents, this.state.events);
        this.setState({
            events: events,
            selectedAttractions: selectedEvents
        });
    }

    setSelectedAttractions = (selectedAttractions, attractionArr) => {
        var attractions = attractionArr.slice();
        for (var attraction of attractions) {
            var attractionID = attraction.id;
            var selected = (selectedAttractions != null && selectedAttractions[attractionID] != null);
            attraction.selected = selected;
        }
        return attractions;
    }

    setRideDPs = (allRideDPs) => {
        //The dpI system saves time but enforces that all rideDPs have the same intervals (should be true)
        var dpI = -1;
        var diffDateTimeStrs = (dtStr1, dtStr2) => {
            return (dtStr1 != null && dtStr2 != null)? (moment(dtStr1, "YYYY-MM-DD HH:mm:ss").valueOf() - moment(dtStr2, "YYYY-MM-DD HH:mm:ss").valueOf()): null;
        }
        var dpDtDiff = null;
        var dpSelectedDtDiff = null;

        var rides = this.state.rides.slice();
        for (var rideDPs of allRideDPs) {
            var rideID = rideDPs.rideID;
            if (dpI < 0) {
                dpI = 0;
                for (var dp of rideDPs.dps) {
                    var dpDT = moment(dp.dateTime, "YYYY-MM-DD HH:mm:ss");
                    if (dpDT >= this.state.dateTime) {
                        break;
                    }
                    dpI++;
                }
                var prevDP = (dpI > 0)? rideDPs.dps[dpI - 1]: null;
                var dp = (dpI < rideDPs.dps.length)? rideDPs.dps[dpI]: null;
                dpDtDiff = (dp != null && prevDP != null)? diffDateTimeStrs(dp.dateTime, prevDP.dateTime): null;
                dpSelectedDtDiff = (prevDP != null && prevDP.dateTime != null)? (this.state.dateTime.valueOf() - moment(prevDP.dateTime, "YYYY-MM-DD HH:mm:ss")): null
            }
            var prevDP = (dpI > 0)? rideDPs.dps[dpI - 1]: null;
            var dp = (dpI < rideDPs.dps.length)? rideDPs.dps[dpI]: null;
            var fpDiff = (dp != null && prevDP != null)? diffDateTimeStrs(dp.fastPassTime, prevDP.fastPassTime): null;
            var fpTime = null;
            if (fpDiff != null) {
                fpTime = moment(prevDP.fastPassTime, "YYYY-MM-DD HH:mm:ss");
                fpTime.add(fpDiff * (dpSelectedDtDiff / dpDtDiff), 'milliseconds');
                var remainder = 5 - (fpTime.minute() % 5);
                fpTime.add(remainder, "minutes");

                var lastFastPassDateTime = moment(rideDPs.rideCloseDateTime, "YYYY-MM-DD HH:mm:ss");
                lastFastPassDateTime.subtract(30, 'minutes');
                if (fpTime > lastFastPassDateTime) {
                    fpTime = null;
                }
            }
            var waitMinsDiff = (dp != null && prevDP != null && dp.waitMins != null && prevDP.waitMins != null)? dp.waitMins - prevDP.waitMins: 0;
            var initialWaitMins = (prevDP != null && prevDP.waitMins != null)? prevDP.waitMins: (dp != null)? dp.waitMins: null;
            var waitMins = null;
            if (initialWaitMins != null && dpSelectedDtDiff != null && dpDtDiff != null) {
                waitMins = initialWaitMins + waitMinsDiff * (dpSelectedDtDiff / dpDtDiff);
                waitMins = Math.round(waitMins / 5.0) * 5;
            }
            var ride = this.rideMap[rideID];
            if (ride != null) {
                ride["waitTimePrediction"] = waitMins;
                ride["fastPassTimePrediction"] = (fpTime != null)? fpTime.format("HH:mm:ss"): null;
            }
        }
        this.setState({
            rides: rides
        });
    }

    refreshFilters = () => {
        API.graphql(graphqlOperation(queries.getFilters)).then((data) => {
            var filters = data.data.getFilters;
            var rideFilters = {};
            var eventFilters = {};
            for (var filter of filters) {
                var attractionIDsMap = {};
                for (var attractionID of filter.attractionIDs) {
                    attractionIDsMap[attractionID] = true;
                }
                var localFilter = {
                    key: filter.name,
                    filterID: filter.name,
                    attractionIDs: attractionIDsMap,
                    type: filter.type,
                    notifyConfig: filter.watchConfig
                };
                if (localFilter.type == 'ride') {
                    rideFilters[filter.name] = localFilter;
                } else {
                    eventFilters[filter.name] = localFilter;
                }
            }
            AsyncStorage.setItem("rideFilters", JSON.stringify(rideFilters));
            AsyncStorage.setItem("eventFilters", JSON.stringify(eventFilters));
            this.setState({
                rideFilters: rideFilters,
                eventFilters: eventFilters
            });
        });
    }

    refreshRideDPs = (date) => {
        var dateStr = date.format("YYYY-MM-DD");
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(queries.getRideDPs, { date: dateStr })).then((data) => {
                var rideDPs = data.data.getRideDPs;
                this.rideDPs[dateStr] = rideDPs;
                if (this.state.dateTime != null && dateStr == this.getParkDateForDateTime(this.state.dateTime).format("YYYY-MM-DD")) {
                    this.setRideDPs(rideDPs);
                }
            });
        });
    }

    updateRideDPs = () => {
        if (this.state.dateTime != null) {
            var date = this.getParkDateForDateTime(this.state.dateTime);
            var dateStr = date.format("YYYY-MM-DD");
            if (this.rideDPsPromises[dateStr]) {
                var rideDPs = this.rideDPs[dateStr];
                if (rideDPs != null) {
                    this.setRideDPs(rideDPs);
                }
            } else {
                this.rideDPsPromises[dateStr] = this.refreshRideDPs(date);
            }
        } else {
            this.setState({
                rides: this.state.rides.slice()
            });
        }
    }

    refreshSchedules = () => {
        var setSchedules = (data) => {
            //Reformat flat array into map of dates to park schedules
            var schedulesArr = data.data.getSchedules;
            var schedulesMap = {};
            for (var schedule of schedulesArr) {
                var parkSchedules = schedulesMap[schedule.date];
                if (parkSchedules == null) {
                    parkSchedules = [];
                    schedulesMap[schedule.date] = parkSchedules;
                }
                parkSchedules.push(schedule);
            }
            AsyncStorage.setItem("schedules", JSON.stringify(schedulesMap));
            this.setState({
                schedules: schedulesMap
            });
            return schedulesMap;
        }

        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(queries.getSchedules)).then((data) => {
                if (this.scheduleCachePromise != null) {
                    this.scheduleCachePromise.then(() => {
                        var schedules = setSchedules(data);
                        resolve(schedules);
                    });
                } else {
                    var schedules = setSchedules(data);
                    resolve(schedules);
                }
            });
        });
    }

    refreshWeather = (date) => {
        return new Promise((resolve, reject) => {
            var dateStr = date;
            if (typeof date != 'string') {
                dateStr = date.format("YYYY-MM-DD")
            }
            //Check if request has already been made
            if (this.refreshWeatherPromises[dateStr] != null) {
                return;
            }

            var refreshPromise = API.graphql(graphqlOperation(queries.getWeather, { date: dateStr }));
            this.refreshWeatherPromises[dateStr] = refreshPromise;
            
            refreshPromise.then((data) => {
                var weathers = data.data.getWeather;
                var weatherMap = Object.assign({}, this.state.weathers);
                for (var weather of weathers) {
                    weatherMap[moment.utc(weather.dateTime).format("YYYY-MM-DD HH:mm:ss")] = weather;
                }
                this.setState({
                    weathers: weatherMap
                });
                resolve(weatherMap);
            });
        });
    }

    refreshPasses = () => {
        console.log("REFRESH PASSES");
        API.graphql(graphqlOperation(queries.getFriendPasses)).then((data) => {
            var friendPasses = data.data.getFriendPasses;
            console.log("FRIEND PASSES: ", JSON.stringify(friendPasses));
            this.setState({
                friendPasses: friendPasses
            });
        });
    }

    refreshRides = () => {
        //TEMPORARY TO CUT BACK ON API CALLS
        this.setState({
            "refreshing": true
        });
        var handleRideUpdate = (recvRides, rideState) => {
            var rides = this.state.rides.slice();
            for (var recvRide of recvRides) {
                var rideID = recvRide.id;
                var ride = this.rideMap[rideID];
                //New ride added, create new json structure in array and map
                if (recvRide.info != null) {
                    var isNewRide = (ride == null);
                    if (isNewRide) {
                        //Add fields to track view of ride row
                        ride = { key: rideID, id: rideID };
                        this.rideMap[rideID] = ride;
                        ride["visible"] = this.attractionInFilter(
                            rideID, 
                            (rideState.activeRideFilters)? rideState.activeRideFilters: this.state.activeRideFilters,
                            (rideState.rideFilters)? rideState.rideFilters: this.state.rideFilters);
                        //Could check if in selectedFilters but might not be desired behavior
                        ride["selected"] = false;
                    }
                    Object.assign(ride, recvRide.info);

                    if (ride["picUrl"] != ride["officialPicUrl"]) {
                        ride.signedPicUrl = this.getSignedUrl(rideID, ride["picUrl"], 1);
                    } else {
                        ride.signedPicUrl = S3_URL + ride["picUrl"] + '-1.webp';
                    }
                    if (isNewRide) {
                        rides.push(ride);
                    }
                }
                if (ride != null && recvRide.time != null) {
                    Object.assign(ride, recvRide.time);
                }
            }
            AsyncStorage.setItem("rideMap", JSON.stringify(this.rideMap));

            this.sort(rides, 
                (rideState.sortMode)? rideState.sortMode: this.state.sortMode, 
                (rideState.sortAsc)? rideState.sortAsc: this.state.sortAsc, 
                this.state.rideQuery);
        }
        var handleUpdate = (data, rideState) => {
            handleRideUpdate(data.data.getRides, rideState);
            updatePromise.then((data) => {
                if (data.data.updateRides != null) {
                    handleRideUpdate(data.data.updateRides, rideState);
                }
                var lastRefresh = moment().format();
                this.setState({
                    refreshing: false,
                    lastRefresh: lastRefresh
                });
                AsyncStorage.setItem("lastRefresh", JSON.stringify(lastRefresh));
            }).catch((ex) => {
                this.setState({
                    refreshing: false
                });
                Toast.show("Rides Couldn't Refresh");
            });
        }

        var updatePromise = API.graphql(graphqlOperation(mutations.getRideTimes));
        API.graphql(graphqlOperation(queries.getRides)).then((data) => {
            if (this.rideCachePromise != null) {
                this.rideCachePromise.then((rideState) => {
                    console.log("RIDESTATE: ", JSON.stringify(rideState));
                    handleUpdate(data, rideState);
                });
            } else {
                console.log("RIDE CACHE PROMISE IS NULL");
                handleUpdate(data, {});
            }
        }).catch((ex) => {
            this.setState({
                refreshing: false
            });
            Toast.show("Rides Couldn't Refresh");
        });
    }

    updateDateTime = (dateTime) => {
        if (dateTime != null) {
            this.refreshWeather(dateTime);
        }
        this.setState({
            dateTime: dateTime
        }, () => {
            this.updateRideDPs();
        });
    }

    updateFilterName = (name) => {
        this.setState({
            filterName: name
        });
    }

    cancelFilterName = () => {
        this.setSelectedRides(null);
        this.setSelectedEvents(null);
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
        if (this.state.selectedAttractions == null) {
            return (<RidesHeader
                refreshing={this.state.refreshing}
                lastRefresh={this.state.lastRefresh}
                schedules={this.state.schedules}
                onRideQueryChanged={ this.updateRideQuery }
                onDateTimeChanged={ this.updateDateTime }
                onReqRefresh={ this.refreshRides }
                userPasses={this.state.friendPasses}
                onPassPress={this.onPassPressed}
                navigation={this.props.navigation} />);
        } else {
            return (<RideFilterHeader 
                filterID={this.state.filterName}
                filters={this.state.rideFilters}
                onSaveFilter={this.saveRideFilter}
                onFilterIDChanged={ this.updateFilterName }
                onFilterEditCancelled={ this.cancelFilterName } />)
        }
    }

    onParkIChanged = (parkI) => {
        this.setState({
            parkI: parkI
        });
    }

    openRide = (rideID) => {
        var dateTime = (this.state.dateTime != null)? this.state.dateTime: moment();
        var date = this.getParkDateForDateTime(dateTime);
        var dateStr = date.format("YYYY-MM-DD");
        var ride = this.rideMap[rideID];
        this.props.navigation.navigate('Ride', {
            ride: ride,
            onRideUpdate: this.onRideUpdate,
            date: dateStr
        });
    }

    onRideUpdate = (newRide) => {
        var rides = this.state.rides.slice();
        var ride = this.rideMap[newRide.id];
        //New ride added, create new json structure in array and map
        Object.assign(ride, newRide);
        if (ride.picUrl != ride.officialPicUrl) {
            this.getSignedUrl(ride.id, ride.picUrl, 1);
        }
        this.sort(rides, this.state.sortMode, this.state.sortAsc, this.state.rideQuery);
    }

    changePassCollapsed = () => {
        this.setState({
            isPassCollapsed: !this.state.isPassCollapsed
        });
    }

    onPassPressed = (user) => {
        this.props.navigation.navigate('Profile', {
            user: user,
            isMe: (user.id == this.props.currentUserID),
            authenticated: this.props.authenticated
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
        var blockLevel = null;
        if (parkSchedules != null) {
            blockLevel = parkSchedules[this.state.parkI].blockLevel;
        }
        return (
        <View style={{ width: "100%", height: "100%" }}>
            <RidesParallax
                parkSchedules={parkSchedules}
                weather={weather}
                parkI={this.state.parkI}
                refreshing={this.state.refreshing}
                renderHeader={this.renderListHeader}
                onRefresh={this.refreshRides}
                onParkIChanged={this.onParkIChanged}>
                    <TouchableOpacity style={{
                        width: "100%"
                    }}
                    onPress={this.changePassCollapsed}>
                        <Text style={{
                            color: Theme.PRIMARY_FOREGROUND,
                            fontSize: 24,
                            textAlign: 'center'
                        }}>
                            Blackouts
                        </Text>
                    </TouchableOpacity>
                    <Collapsible collapsed={this.state.isPassCollapsed}>
                        <PassList 
                            userPasses={this.state.friendPasses}
                            blockLevel={blockLevel}
                            onPress={this.onPassPressed}
                            onLongPress={this.onPassPressed} />
                    </Collapsible>

                    <RideList 
                        rides={this.state.rides}
                        predicting={this.state.dateTime != null}
                        filters={this.state.fitlers}
                        activeFilters={this.state.activeFilters}
                        selectedRides={this.state.selectedAttractions}
                        onSelectedRidesChanged={this.setSelectedRides}
                        openRide={this.openRide} />
                    <View style={{
                        width: "100%",
                        height: (this.state.showFilters)? 300: 0,
                        backgroundColor: Theme.PRIMARY_BACKGROUND
                    }}></View>
            </RidesParallax>
            { (this.state.showFilters)?
                (<RideFilters
                    filters={this.state.rideFilters}
                    activeFilters={this.state.activeRideFilters}
                    sortMode={this.state.sortMode}
                    sortAsc={this.state.sortAsc}
                    onSortModeChanged={ this.updateSortMode }
                    onSortAscChanged={ this.updateSortAsc }
                    onWatch={this.watchRideFilter}
                    onUnwatch={this.unwatchRideFilter}
                    onActiveFiltersChanged={this.setActiveRideFilters}
                    onEditFilters={this.editFilters}
                    onDeleteFilters={this.deleteRideFilters}
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
