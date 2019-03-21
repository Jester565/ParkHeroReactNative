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
import { GetBlockLevel } from '../pass/PassLevel';
import Theme from '../../Theme';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import NetManager from '../../NetManager';

Amplify.configure(AwsExports);

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
            dateTime: null,
            selectedRides: null,
            rideQuery: "",
            filterName: "",
            activeFilters: null,
            showFilters: false,
            sortMode: 'Name',
            sortAsc: true,
            //network state
            rides: [],
            filters: [],
            schedules: {},
            weathers: {},
            userPasses: null,
            refreshing: false,
            parkI: 0
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
                getParsedItem('filters'),
                getParsedItem('activeFilters'),
                getParsedItem('lastRefresh')];
            
            var results = await Promise.all(promises);
            var rideMap = results[0];
            var sortMode = results[1];
            var sortAsc = results[2];
            var filters = results[3];
            var activeFilters = results[4];
            var lastRefresh = results[5];
    
            var newState = {};
            if (sortMode != null) {
                newState["sortMode"] = sortMode;
            }
            if (sortAsc != null) {
                newState["sortAsc"] = sortAsc;
            }
            if (filters != null) {
                newState["filters"] = filters;
            }
            if (activeFilters != null) {
                newState["activeFilters"] = activeFilters;
            }
            if (lastRefresh != null) {
                newState["lastRefresh"] = lastRefresh;
            }
            console.log("FILTERS: ", JSON.stringify(filters));
            console.log("ACTIVE FILTERS: ", JSON.stringify(activeFilters));
            if (rideMap != null) {
                var rides = [];
                for (var rideID in rideMap) {
                    var ride = rideMap[rideID];
                    ride.visible = this.rideInFilter(rideID, 
                        (activeFilters)? activeFilters: this.state.activeFilters, 
                        (filters)? filters: this.state.filters);
                    ride.selected = false;
                    ride.signedPicUrl = 'https://s3-us-west-2.amazonaws.com/disneyapp3/' + ride["picUrl"] + '-1.webp';
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
        this.refreshRides();
        this.refreshSchedules();
        //this.refreshPasses(schedulePromise);
        this.refreshWeather(moment());
        this.refreshFilters();
    }

    getSignedUrl = (rideID, url, sizeI) => {
        var key = url + '-' + sizeI.toString() + '.webp';
        console.log("GET SIGNED URL: ", key);
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

    rideInFilter = (rideID, activeFilters, filters) => {
        if (activeFilters != null) {
            for (var filterID in activeFilters) {
                var filter = filters[filterID];
                if (filter.rideIDs[rideID] == null) {
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

    setActiveFilters = (activeFilters) => {
        var rides = this.state.rides.slice();
        for (var ride of rides) {
            var rideID = ride.id;
            if (ride.visible != this.rideInFilter(rideID, activeFilters, this.state.filters)) {
                ride.visible = !ride.visible;
            }
        }

        AsyncStorage.setItem("activeFilters", JSON.stringify(activeFilters));

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

        AsyncStorage.setItem("filters", JSON.stringify(filters));

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            rideIDs: Object.keys(filter.rideIDs),
            watchConfig: notifyConfig
        })).then((data) => {
            console.log("WATCH FILTER"); 
        });
    }

    unwatchFilter = (filterID) => {
        var filters = this.state.filters;
        var filter = filters[filterID];
        filter["notifyConfig"] = null;
        this.setState({
            filters: filters
        });

        AsyncStorage.setItem("filters", JSON.stringify(filters));

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            rideIDs: Object.keys(filter.rideIDs),
            watchConfig: null
        })).then((data) => {
            console.log("UNWATCH FILTER"); 
        });
    }

    deleteFilters = (deleteFilters) => {
        var filters = this.state.filters;
        var activeFilters = this.state.activeFilters;
        var filterNames = [];
        for (var filter of deleteFilters) {
            filterNames.push(filter.filterID);
            if (activeFilters != null) {
                delete activeFilters[filter.filterID];
            }
            delete filters[filter.filterID];
        }
        this.setState({
            filter: filters,
            activeFilters: activeFilters
        });
    
        AsyncStorage.setItem("filters", JSON.stringify(filters));

        API.graphql(graphqlOperation(mutations.deleteFilters, { filterNames: filterNames })).then((data) => {
            console.log("DELETE FILTERS"); 
        });
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

        AsyncStorage.setItem("filters", JSON.stringify(filters));

        this.setSelectedRides(null);
        this.setState({
            filters: filters,
            filterName: ''
        });

        API.graphql(graphqlOperation(mutations.updateFilter, { 
            filterName: filter.filterID, 
            rideIDs: Object.keys(filter.rideIDs),
            watchConfig: filter.notifyConfig 
        })).then((data) => {
            console.log("UPDATE FILTER"); 
        });
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
            ride["waitTimePrediction"] = waitMins;
            ride["fastPassTimePrediction"] = (fpTime != null)? fpTime.format("HH:mm:ss"): null;
        }
        this.setState({
            rides: rides
        });
    }

    refreshFilters = () => {
        API.graphql(graphqlOperation(queries.getFilters)).then((data) => {
            var filters = data.data.getFilters;
            var localFilters = {};
            for (var filter of filters) {
                var rideIDsMap = {};
                for (var rideID of filter.rideIDs) {
                    rideIDsMap[rideID] = true;
                }
                localFilters[filter.name] = {
                    key: filter.name,
                    filterID: filter.name,
                    rideIDs: rideIDsMap,
                    notifyConfig: filter.watchConfig
                };
            }
            AsyncStorage.setItem("filters", JSON.stringify(localFilters));
            this.setState({
                filters: localFilters
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

    refreshPasses = (schedulePromise) => {
        return new Promise((resolve, reject) => {
            var promises = [];
            promises.push(schedulePromise);
            promises.push(API.graphql(graphqlOperation(queries.listFriendPasses)));
            Promise.all(promises).then((results) => {
                var data = results[1];
                this.friendPasses = data.data.listFriendPasses;
                this.updateBlackoutPasses(moment(), results[0]);
                resolve();
            });
        });
    }

    updateBlackoutPasses = (dateTime, schedules) => {
        var date = this.getParkDateForDateTime(dateTime);
        var parkSchedules = this.getParkSchedules(schedules, date);

        var blockLevel = parkSchedules[this.state.parkI].blockLevel;

        var userIDs = [];
        var cangoPasses = {};
        for (var userPasses of this.friendPasses) {
            var userID = null;
            var passes = [];
            for (var pass of userPasses.passes) {
                if (GetBlockLevel(pass.type) >= blockLevel) {
                    if (userID == null) {
                        userID = userPasses.user.id;
                        userIDs.push(userID);
                    }
                    passes.push(pass);
                }
            }
            if (userID != null) {
                cangoPasses[userID] = passes;
            }
        }
        console.log("USERIDS: ", userIDs);
        if (userIDs.length > 0) {
            API.graphql(graphqlOperation(queries.getUsers, { ids: userIDs })).then((data) => {
                var users = data.data.getUsers;
                for (var user of users) {
                    var passes = cangoPasses[user.id];
                    userPasses.push({ key: user.id, user: user, passes: passes });
                }
                console.log("USER PASSES UPDATED: ", JSON.stringify(userPasses));
                this.setState({
                    userPasses: userPasses
                });
            });
        } else {
            this.setState({
                userPasses: null
            });
        }
    }

    refreshRides = () => {
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
                        ride["visible"] = this.rideInFilter(
                            rideID, 
                            (rideState.activeFilters)? rideState.activeFilters: this.state.activeFilters,
                            (rideState.filters)? rideState.filters: this.state.filters);
                        //Could check if in selectedFilters but might not be desired behavior
                        ride["selected"] = false;
                    }
                    Object.assign(ride, recvRide.info);

                    if (ride["picUrl"] != ride["officialPicUrl"]) {
                        ride.signedPicUrl = this.getSignedUrl(rideID, ride["picUrl"], 1);
                    } else {
                        ride.signedPicUrl = 'https://s3-us-west-2.amazonaws.com/disneyapp3/' + ride["picUrl"] + '-1.webp';
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
        console.log("DATETIME SET: ", dateTime);
        if (dateTime != null) {
            this.refreshWeather(dateTime);
        }
        this.setState({
            dateTime: dateTime
        }, () => {
            this.updateRideDPs()
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
                refreshing={this.state.refreshing}
                lastRefresh={this.state.lastRefresh}
                schedules={this.state.schedules}
                onRideQueryChanged={ this.updateRideQuery }
                onDateTimeChanged={ this.updateDateTime }
                onReqRefresh={ this.refreshRides } />);
        } else {
            return (<RideFilterHeader 
                filterID={this.state.filterName}
                filters={this.state.fitlers}
                onSaveFilter={this.saveFilter}
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
                parkI={this.state.parkI}
                refreshing={this.state.refreshing}
                renderHeader={this.renderListHeader}
                onRefresh={this.refreshRides}
                onParkIChanged={this.onParkIChanged}>
                    {
                        (this.state.userPasses != null)?
                            (<PassList 
                                userPasses={this.state.userPasses} />): null
                    }

                    <RideList 
                        rides={this.state.rides}
                        predicting={this.state.dateTime != null}
                        filters={this.state.fitlers}
                        activeFilters={this.state.activeFilters}
                        selectedRides={this.state.selectedRides}
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
