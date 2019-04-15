import React from 'react';
import { View, Text } from 'react-native';
import { Icon, SearchBar } from 'react-native-elements';
import Theme from '../../Theme';
import moment from 'moment';
import AttractionList from '../ride/AttractionList';
import RideRow from '../ride/RideRow';
import distance from 'jaro-winkler';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import * as queries from '../../src/graphql/queries';
import AwsExports from '../../AwsExports';

Amplify.configure(AwsExports);

export default class RideSelector extends React.Component {
    static navigationOptions = {
        title: 'RideSelector',
        header: null
    };

    constructor(props) {
        super();
        this.rideMap = {};
        this.signedUrls = {};
        this.signPromises = {};

        const { navigation } = props;
        var labels = navigation.getParam('labels');
        var dateTimeStr = navigation.getParam('dateTimeStr');
        var dateTime = moment(dateTimeStr, 'YYYY-MM-DD HH:mm:ss');
        

        this.state = {
            rides: [],
            dateTime: dateTime,
            labels: labels,
            query: ""
        };
    }

    componentWillMount() {
        this.refereshDataPoints(this.state.dateTime);
    }

    getSignedRideUrl = (rideID, url, sizeI) => {
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

    setRideDPs = (allRideDPs) => {
        var diffDateTimeStrs = (dtStr1, dtStr2) => {
            return (dtStr1 != null && dtStr2 != null)? (moment(dtStr1, "YYYY-MM-DD HH:mm:ss").valueOf() - moment(dtStr2, "YYYY-MM-DD HH:mm:ss").valueOf()): null;
        }
        var dpDtDiff = null;
        var dpSelectedDtDiff = null;

        var rides = [];
        for (var rideDPs of allRideDPs) {
            if (this.state.labels != null && this.state.labels.length > 0) {
                var matchesLabels = false;
                for (var label of this.state.labels) {
                    if (rideDPs.rideLabels.indexOf(label) >= 0) {
                        matchesLabels = true;
                        break;
                    }
                }
                if (!matchesLabels) {
                    continue;
                }
            }
            var dpI = 0;
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
            dpSelectedDtDiff = (prevDP != null && prevDP.dateTime != null)? (this.state.dateTime.valueOf() - moment(prevDP.dateTime, "YYYY-MM-DD HH:mm:ss")): null;
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
            var ride = {
                id: rideDPs.rideID,
                name: rideDPs.rideName,
                signedPicUrl: (rideDPs.ridePicUrl != rideDPs.officialRidePicUrl)? this.getSignedRideUrl(rideDPs.rideID, rideDPs.ridePicUrl, 1): rideDPs.officialRidePicUrl,
            }
            if (ride != null) {
                ride["waitTimePrediction"] = waitMins;
                ride["fastPassTimePrediction"] = (fpTime != null)? fpTime.format("HH:mm:ss"): null;
            }
            this.rideMap[rideDPs.rideID] = ride;
            rides.push(ride);
        }
        console.log("SET RIDES: ", JSON.stringify(rides));
        this.setState({
            rides: rides
        }, () => {
            this.onQueryChanged(this.state.query);
        });
    }

    refereshDataPoints = (date) => {
        var dateStr = date.format("YYYY-MM-DD");
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(queries.getRideDPs, { date: dateStr })).then((data) => {
                var rideDPs = data.data.getRideDPs;
                this.setRideDPs(rideDPs);
            });
        });
    }

    onQueryCleared = () => {
        this.onQueryChanged("");
    }

    onQueryChanged = (query) => {
        var rides = this.state.rides.slice();
        if (query != null && query.length > 0) {
            rides.sort((attr1, attr2) => {
                var dist1 = distance(query, attr1["name"], { caseSensitive: false });
                var dist2 = distance(query, attr2["name"], { caseSensitive: false });
                return dist2 - dist1;
            });
        } else {
            rides.sort((attr1, attr2) => {
                var fp1 = (attr1["fastPassTimePrediction"] != null)? moment(attr1["fastPassTimePrediction"], 'HH:mm:ss').valueOf(): -1;
                var fp2 = (attr2["fastPassTimePrediction"] != null)? moment(attr2["fastPassTime"], 'HH:mm:ss').valueOf(): -1;
                return fp2 - fp1;
            });
        }
        this.setState({
            rides: rides,
            query: query
        });
    }

    onRidePress = (rideID) => {
        const { navigation } = this.props;
        var onRideSelected = navigation.getParam('onRideSelected');
        onRideSelected(this.rideMap[rideID]);
        navigation.goBack();
    }

    renderRide = (ride) => {
        return (
            <RideRow
            id={ride.id}
            visible={true}
            selected={false}
            waitTime={ride.waitTimePrediction}
            fastPassTime={ride.fastPassTimePrediction}
            waitRating={5}
            status={"--"}
            name={ride.name}
            signedPicUrl={ride.signedPicUrl}
            onLongPress={this.onRidePress}
            onPress={this.onRidePress} />);
    }

    render() {
        var clearIcon = (this.state.query != null && this.state.query.length > 0)? { name: 'close', style: { width: 30, height: 30, marginLeft: 3, marginTop: -7, fontSize: 30, alignSelf: "center" } }: null;
        return (
        <View style={{
            marginBottom: 100
        }}>
            <View style={{
                width: "100%",
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignContent: 'center',
                backgroundColor: 'black'
            }}>
                <SearchBar 
                    placeholder='Rides'
                    icon={{ name: 'search', style: { fontSize: 25, height: 25, marginTop: -4 } }}
                    clearIcon={clearIcon}
                    value={this.state.query}
                    containerStyle={{
                        width: "70%",
                        height: 58,
                        backgroundColor: Theme.PRIMARY_BACKGROUND,
                        borderBottomColor: "rgba(0, 0, 0, 0.3)",
                        borderBottomWidth: 2,
                        borderTopWidth: 0
                    }}
                    inputStyle={{
                        marginLeft: 15,
                        paddingTop: 0,
                        paddingBottom: 0,
                        fontSize: 22,
                        color: Theme.PRIMARY_FOREGROUND
                    }}
                    onChangeText={this.onQueryChanged}
                    onClearText={this.onQueryCleared} />
                <Text style={{
                    fontSize: 30,
                    color: 'white'
                }}>
                    {this.state.dateTime.format("h:mm A")}
                </Text>
            </View>
            <AttractionList
                attractions={this.state.rides}
                renderAttraction={this.renderRide} />
        </View>);
    }
};
