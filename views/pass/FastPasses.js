import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, AppState, Dimensions, BackHandler } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider, Divider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import Collapsible from 'react-native-collapsible';
import AwsExports from '../../AwsExports';
import { PagerDotIndicator, IndicatorViewPager } from 'rn-viewpager';
import Barcode from 'react-native-barcode-builder';
import Theme from '../../Theme';
import moment from 'moment';
import * as Animatable from 'react-native-animatable';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import * as subscriptions from '../../src/graphql/subscriptions';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import NetManager from '../../NetManager';
import PassGroupRow from './PassGroupRow';
import TransactionRow from './TransactionRow';
import PassCreatorRow from './PassCreatorRow';
import Toast from 'react-native-root-toast';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class FastPasses extends React.Component {
    constructor(props) {
        super(props);

        this.TRANSACTION_HEIGHT = 250;
        
        this.signedUrls = {};
        this.signPromises = {};

        this.MAX_SEL_MIN_DIFF = 2;

        this.state = {
            allTransactions: [],
            passGroups: [],
            showCreator: false,
            passes: [],
            submitting: false
        };
    }

    componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        this.netSubToken = NetManager.subscribe(this.onNetChange);
    }

    componentWillUnmount() {
        NetManager.unsubscribe(this.netSubToken);
    }

    onNetChange = (event, payload) => {
        if (event == 'netSignIn') {
            //this.parseFastPasses(null);
            this.refreshFastPasses();
        }
    }

    handleBackPress = () => {
        if (this.state.showCreator) {
            this.hideFastPassCreator();
            return true;
        }
        return false;
    }

    getSignedUrl = (attractionID, url, sizeI) => {
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
            var allTransactions = this.state.allTransactions.slice();
            allTransactions.forEach((transaction, i) => {
                if (transaction.attractionID == attractionID) {
                    transaction.signedPicUrl = signedUrl;
                    allTransactions[i] = Object.assign({}, transaction);
                }
            });
            this.setState({
                allTransactions: allTransactions
            });
        });
    }

    hsvToRgb(h, s, v) {
        var r, g, b;

        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        var rgbArr = [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
        return 'rgb(' + rgbArr.join(', ') + ')';
    }

    genUniqueColors(total)
    {
        var i = (total > 0)? 360 / total: 0; // distribute the colors evenly on the hue range
        var colors = []; // hold the generated colors
        for (var x=0; x<total; x++)
        {
            colors.push(this.hsvToRgb((i * x) / 360.0, 0.6, 1)); // you can also alternate the saturation and value for even more contrast between the colors
        }
        return colors;
    }

    /*
        Response: {
            transactions: [{
                attractionID,
                attractionName,
                attractionPicUrl,
                attractionOfficialPicUrl,
                startDateTime,
                endDateTime,
                passes: [{
                    id,
                    startDateTime,
                    endDateTime
                }]
            }],
            plannedTransactions: [{
                id,
                attractionID,
                attractionName,
                attractionPicUrl,
                attractionOfficialPicUrl,
                selectionDateTime,
                fastPassTime,
                passes: [{
                    id,
                    priority,
                    nextSelectionDateTime
                }]
            }],
            allUserPasses: [
                {
                    user: {
                        id,
                        profilePicUrl,
                        name
                    }
                    allPasses: [
                        {
                            pass: {
                                passID,
                                name,
                                expirationDT,
                                type
                            }
                            fastPassInfo: {
                                selectionDateTime,
                                earliestSelectionDateTime,
                                priority,
                                earliestSelectionDateTimes
                            ]
                        }
                    ]
                }
            ]
        }
    */
    parseFastPasses = (fastPassData) => {
        console.log("FASTPASSDATA: ", JSON.stringify(fastPassData));
        /*
        var dateStr = '2019-03-26';
        fastPassData = {
            transactions: [{
                attractionID: '353295',
                attractionName: 'Big Thunder',
                attractionPicUrl: 'pics/us-west-2:7113e7d7-62e3-460b-b1c1-e60a35e4782f/09503442-7205-4adf-a1e8-ce22950bc253',
                attractionOfficialPicUrl: 'ree',
                startDateTime: dateStr + ' 18:25:00',
                endDateTime: dateStr + ' 19:25:00',
                passes: [{
                    id: '801150017504820660',
                    startDateTime: dateStr + ' 18:20:00',
                    endDateTime: dateStr + ' 19:20:00'
                }, {
                    id: '467870004300754088',
                    startDateTime: dateStr + ' 18:25:00',
                    endDateTime: dateStr + ' 19:25:00'
                }]
            }],
            //Offload planning evaluation to server?
            plannedTransactions: [{
                attractionID: '16514416',
                attractionName: 'Cars Ride',
                attractionPicUrl: 'rides/16514416',
                attractionOfficialPicUrl: 'rides/16514416',
                selectionDateTime: dateStr + ' 16:45:00',
                fastPassTime: dateStr + ' 19:05:00',
                passes: [
                    {
                        id: '467870004300754088',
                        priority: 0,
                        nextSelectionDateTime: dateStr + ' 18:45:00'
                    }
                ]
            }],
            allUserPasses: [
                {
                    user: {
                        id: 'us-west-2:7113e7d7-62e3-460b-b1c1-e60a35e4782f',
                        profilePicUrl: 'profileImgs/us-west-2:7113e7d7-62e3-460b-b1c1-e60a35e4782f-1552786083577',
                        name: 'Test0'
                    },
                    allPasses: [{
                        pass: {
                            id: '801150017504820660',
                            name: "ALEX CRAIG",
                            expirationDT: "2019-06-25",
                            type: 'socal-annual',
                            isEnabled: true,
                            isPrimary: false,
                            hasMaxPass: true
                        },
                        fastPassInfo: {
                            selectionDateTime: dateStr + ' 16:45:00',
                            earliestSelectionDateTime: dateStr + ' 16:35:00'
                        }
                    }]
                },
                {
                    user: {
                        id: 'us-west-2:7113e7d7-62e3-460b-b1c1-e60a35e4782f',
                        profilePicUrl: 'profileImgs/us-west-2:7113e7d7-62e3-460b-b1c1-e60a35e4782f-1552786083577',
                        name: 'Test1'
                    },
                    allPasses: [{
                        pass: {
                            id: '467870004300754088',
                            name: "ABHI",
                            expirationDT: "2019-04-25",
                            type: 'standard',
                            isEnabled: true,
                            isPrimary: false,
                            hasMaxPass: false
                        },
                        fastPassInfo: {
                            selectionDateTime: dateStr + ' 16:45:00',
                            earliestSelectionDateTime: dateStr + ' 16:45:00'
                        }
                    }]
                }
            ]
        }
        */
        
        var passes = [];
        var allPassMap = {};
        for (var userPasses of fastPassData.allUserPasses) {
            for (var allPass of userPasses.allPasses) {
                allPass.pass.user = userPasses.user;
                allPassMap[allPass.pass.id] = allPass;
                var earliestSelectionDateTimes = [];
                for (var selectionDateTimeStr of allPass.fastPassInfo.earliestSelectionDateTimes) {
                    earliestSelectionDateTimes.push((selectionDateTimeStr != null)? moment(selectionDateTimeStr, "YYYY-MM-DD HH:mm:ss"): null);
                }
                passes.push({
                    key: allPass.pass.id,
                    id: allPass.pass.id,
                    name: (allPass.pass.name != null)? allPass.pass.name: allPass.pass.id.substr(allPass.pass.id.length - 5),
                    priority: (allPass.fastPassInfo.priority != null)? allPass.fastPassInfo.priority + 1: 0,
                    earliestSelectionDateTimes: earliestSelectionDateTimes,
                    currentPriority: (allPass.fastPassInfo.priority != null)? allPass.fastPassInfo.priority + 1: 0,
                    enabled: true
                });
            }
        }
        console.log("HERE 1");
        var passGroups = [];
        this.passGroupMap = {};
        var groupName = 'A';
        var addGroup = (groupPasses) => {
            var passIDs = [];
            var userPasses = [];
            var selectionDateTimes = [];
            for (var pass of groupPasses) {
                passIDs.push(pass.id);
                userPasses.push(allPassMap[pass.id].pass);
                if (allPassMap[pass.id].fastPassInfo && allPassMap[pass.id].fastPassInfo.selectionDateTime) {
                    selectionDateTimes.push(moment(allPassMap[pass.id].fastPassInfo.selectionDateTime, "YYYY-MM-DD HH:mm:ss"));
                }
            }
            //Sort passIDs so groupIDs are the same
            passIDs.sort();
            //Sorts selection times so that the max is at 0
            selectionDateTimes.sort((dt1, dt2) => {
                return dt2.valueOf() - dt1.valueOf();
            });
            var passIDsConcat = "";
            for (var passID of passIDs) {
                passIDsConcat += passID;
            }
            if (this.passGroupMap[passIDsConcat] == null) {
                var passGroup = { 
                    key: passIDsConcat, 
                    passes: userPasses,
                    groupName: groupName,
                    maxSelectionDateTime: (selectionDateTimes.length > 0)? selectionDateTimes[0]: null 
                };
                this.passGroupMap[passIDsConcat] = passGroup;
                passGroups.push(passGroup);
                groupName = String.fromCharCode(groupName.charCodeAt() + 1);
            }
            return passIDsConcat;
        }
        //Passes with different selection datetimes are in different groups
        var passSelectionDateTimes = [];
        for (var passID in allPassMap) {
            var allPass = allPassMap[passID];
            var selectionMillis = (allPass.fastPassInfo && allPass.fastPassInfo.selectionDateTime)? moment(allPass.fastPassInfo.selectionDateTime, 'YYYY-MM-DD HH:mm:ss').valueOf(): 0;
            passSelectionDateTimes.push({
                millis: selectionMillis,
                pass: { id: passID }
            });
        }
        console.log("HERE 2");
        passSelectionDateTimes.sort((d1, d2) => {
            return d1.millis - d2.millis
        });

        var selectionTimePasses = [];
        passSelectionDateTimes.forEach((passSelectionDateTime, i) => {
            var minDiff = (i > 0)? (passSelectionDateTime.millis - passSelectionDateTimes[i - 1].millis)/ (60 * 1000): 0;
            if (Math.abs(minDiff) > this.MAX_SEL_MIN_DIFF) {
                addGroup(selectionTimePasses);
                selectionTimePasses = [];
            }
            selectionTimePasses.push(passSelectionDateTime.pass);
        });
        console.log("HERE 3");
        if (selectionTimePasses.length > 0) {
            addGroup(selectionTimePasses);
        }
        
        var allTransactions = [];
        
        console.log("HERE 4");
        for (var transaction of fastPassData.transactions) {
            var groupKey = addGroup(transaction.passes);
            transaction.passGroups = [groupKey];
            transaction.planned = false;
            allTransactions.push(transaction);
        }
        console.log("HERE 5");
        for (var plannedTransaction of fastPassData.plannedTransactions) {
            var priorityToPasses = {};
            for (var pass of plannedTransaction.passes) {
                if (priorityToPasses[pass.priority] == null) {
                    priorityToPasses[pass.priority] = [];
                }
                priorityToPasses[pass.priority].push(pass);
            }
            plannedTransaction.priorityPassGroups = {};
            for (var priority in priorityToPasses) {
                var groupKey = addGroup(priorityToPasses[priority]);
                plannedTransaction.priorityPassGroups[priority] = groupKey;
            }
            plannedTransaction.planned = true;
            allTransactions.push(plannedTransaction);
        }
        console.log("HERE 6");
        
        var uniqueColors = this.genUniqueColors(passGroups.length);
        passGroups.forEach((passGroup, i) => {
            passGroup.color = uniqueColors[i];
        });
        allTransactions.sort((t1, t2) => {
            var dtStr1 = (t1.planned)? t1.fastPassTime: t1.startDateTime;
            var dtStr2 = (t2.planned)? t2.fastPassTime: t2.startDateTime;
            var dt1 = moment(dtStr1, "YYYY-MM-DD HH:mm:ss");
            var dt2 = moment(dtStr2, "YYYY-MM-DD HH:mm:ss");
            return dt1.valueOf() - dt2.valueOf();
        });
        var lastPlanned = null;
        var y = 0;
        for (var transaction of allTransactions) {
            if (transaction.planned === lastPlanned) {
                y += this.TRANSACTION_HEIGHT / 2;
            }
            transaction.y = y;

            y += this.TRANSACTION_HEIGHT / 2;
            lastPlanned = transaction.planned;
            transaction.signedPicUrl = (transaction.attractionOfficialPicUrl == transaction.attractionPicUrl)? 
                S3_URL + transaction.attractionOfficialPicUrl + "-2.webp": 
                this.getSignedUrl(transaction.attractionID, transaction.attractionPicUrl, 2);
        }
        console.log("HERE 7");
        this.setState({
            allTransactions: allTransactions,
            passGroups: passGroups,
            passes: passes,
            height: y + this.TRANSACTION_HEIGHT / 2
        });

        this.plannedTransactions = fastPassData.plannedTransactions;
    }

    refreshFastPasses = () => {
        API.graphql(graphqlOperation(queries.getFastPasses)).then((data) => {
            var fastPassData = data.data.getFastPasses;
            this.parseFastPasses(fastPassData);
        });
    }

    renderPassGroup = ({item}) => {
        var passGroup = item;
        return <PassGroupRow
            name={passGroup.groupName}
            passes={passGroup.passes}
            maxSelectionDateTime={passGroup.maxSelectionDateTime}
            color={passGroup.color} />
    }

    renderPassGroups = () => {
        return (<FlatList
            data={this.state.passGroups}
            renderItem={this.renderPassGroup}
        />);
    }

    renderTransaction = (item) => {
        var transaction = item;
        var passGroups = [];
        if (transaction.planned) {
            for (var priority in transaction.priorityPassGroups) {
                var groupKey = transaction.priorityPassGroups[priority];
                var group = this.passGroupMap[groupKey];
                var name = group.groupName;
                var color = group.color;
                passGroups.push({
                    priority: priority,
                    name: name,
                    color: color
                });
            }
        } else {
            for (var groupKey of transaction.passGroups) {
                var group = this.passGroupMap[groupKey];
                var name = group.groupName;
                var color = group.color;
                passGroups.push({
                    name: name,
                    color: color
                });
            }
        }
        return (<TransactionRow
            y={transaction.y}
            id={transaction.id}
            planned={transaction.planned}
            name={transaction.attractionName}
            height={this.TRANSACTION_HEIGHT}
            startDateTimeStr={transaction.startDateTime}
            endDateTimeStr={transaction.endDateTime}
            fastPassTimeStr={transaction.fastPassTime}
            orderDateTimeStr={transaction.selectionDateTime}
            signedPicUrl={transaction.signedPicUrl}
            passGroups={passGroups}
            onRemoveTransaction={this.removeTransaction} />);
    }

    onRideSelected = (ride) => {
        console.log("RIDE SELECTED: ", JSON.stringify(ride));
        this.addTransaction(ride.id);
    }

    onOpenRideSelector = () => {
        var latestSelectionDateTime = null;
        for (var pass of this.state.passes) {
            if (pass.enabled) {
                var selectionDateTime = pass.earliestSelectionDateTimes[pass.currentPriority];
                if (selectionDateTime == null || selectionDateTime < moment()) {
                    selectionDateTime = moment();
                }
                if (latestSelectionDateTime == null || selectionDateTime > latestSelectionDateTime) {
                    latestSelectionDateTime = selectionDateTime;
                }
            }
        }
        this.props.navigation.navigate('RideSelector', {
            labels: ["FASTPASS"],
            dateTimeStr: latestSelectionDateTime.format("YYYY-MM-DD HH:mm:ss"),
            onRideSelected: this.onRideSelected,
            showCreator: false
        });
    }

    addTransaction = (rideID) => {
        this.setState({
            submitting: true
        });
        var passToPriorities = {};
        var newFpPasses = [];
        for (var pass of this.state.passes) {
            if (pass.enabled) {
                newFpPasses.push({
                    id: pass.id,
                    priority: pass.currentPriority
                });
                passToPriorities[pass.id] = pass.currentPriority;
            }
        }
        console.log("PASSES TO PRIORITIES: ", JSON.stringify(passToPriorities));
        var payload = [];
        for (var plannedTransaction of this.plannedTransactions) {
            var passes = [];
            for (var pass of plannedTransaction.passes) {
                var newPriority = (passToPriorities[pass.id] != null && passToPriorities[pass.id] <= pass.priority)? pass.priority + 1: pass.priority;
                passes.push({
                    id: pass.id,
                    priority: newPriority
                });
            }
            payload.push({
                rideID: plannedTransaction.attractionID,
                passes: passes
            });
        }
        
        payload.push({
            rideID: rideID,
            passes: newFpPasses
        });
        API.graphql(graphqlOperation(mutations.updatePlannedFpTransactions, { plannedTransactions: payload })).then((data) => {
            var fastPassData = data.data.updatePlannedFpTransactions;
            console.log("MUTATION FAST PASS DATA: ", JSON.stringify(fastPassData));
            this.parseFastPasses(fastPassData);
            Toast.show('PLANNED FP ADDED');
            this.setState({
                submitting: false
            });
        }).catch((e) => {
            Toast.show('FP ERR: ' + JSON.stringify(e), {
                duration: 120000
            });
            this.setState({
                submitting: false
            });
        });
    }

    removeTransaction = (transactionID) => {
        this.setState({
            submitting: true
        });
        var passToPriorities = {};
        var payload = [];
        for (var plannedTransaction of this.plannedTransactions) {
            if (plannedTransaction.id == transactionID) {
                for (var pass of plannedTransaction.passes) {
                    passToPriorities[pass.id] = pass.priority;
                }
                break;
            }
        }
        for (var plannedTransaction of this.plannedTransactions) {
            if (plannedTransaction.id != transactionID) {
                var passes = [];
                for (var pass of plannedTransaction.passes) {
                    var newPriority = (passToPriorities[pass.id] != null && passToPriorities[pass.id] < pass.priority)? pass.priority - 1: pass.priority;
                    passes.push({
                        id: pass.id,
                        priority: newPriority
                    });
                }
                payload.push({
                    rideID: plannedTransaction.attractionID,
                    passes: passes
                });
            }
        }
        
        API.graphql(graphqlOperation(mutations.updatePlannedFpTransactions, { plannedTransactions: payload })).then((data) => {
            try {
                var fastPassData = data.data.updatePlannedFpTransactions;
                console.log("REMOVE FAST PASS DATA: ", JSON.stringify(fastPassData));
                this.parseFastPasses(fastPassData);
                Toast.show('PLANNED FP REMOVED');
                this.setState({
                    submitting: false
                });
            } catch (e) {
                console.log("REFRESH FP DISPLAY ERR: ", JSON.stringify(e));
                Toast.show('REFRESH FP DISPLAY ERR: ' + JSON.stringify(e), {
                    duration: 120000
                });
            }
        }).catch((e) => {
            Toast.show('FP REMOVE ERR: ' + JSON.stringify(e), {
                duration: 120000
            });
            this.setState({
                submitting: false
            });
        });
    }

    showFastPassCreator = () => {
        this.setState({
            showCreator: true
        });
    }

    hideFastPassCreator = () => {
        this.setState({
            showCreator: false
        });
    }

    onPriorityChanged = (passID, priority) => {
        var passes = this.state.passes.slice();
        passes.forEach((arrPass, i) => {
            if (arrPass.id == passID) {
                var newPass = Object.assign({}, arrPass);
                newPass.currentPriority = priority;
                passes[i] = newPass;
            }
        });
        this.setState({
            passes: passes
        });
    }
    
    onEnableChanged = (passID) => {
        var passes = this.state.passes.slice();
        passes.forEach((arrPass, i) => {
            if (arrPass.id == passID) {
                var newPass = Object.assign({}, arrPass);
                newPass.enabled = !newPass.enabled;
                console.log("ENABLED SET: ", newPass.enabled);
                passes[i] = newPass;
            }
        });
        this.setState({
            passes: passes
        });
    }

    renderCreatorPass = ({item}) => {
        var pass = item;
        var selectionDateTime = pass.earliestSelectionDateTimes[pass.currentPriority];
        if (selectionDateTime == null || selectionDateTime < moment()) {
            selectionDateTime = moment();
        }
        var selectionDateTimeStr = selectionDateTime.format("h:mm A");
        return (<PassCreatorRow
            id={pass.id}
            name={pass.name}
            enabled={pass.enabled}
            selectionDateTimeStr={selectionDateTimeStr}
            maxPriority={pass.priority}
            currentPriority={pass.currentPriority}
            onPriorityChanged={this.onPriorityChanged}
            onCheckPressed={this.onEnableChanged} />);
    }

    renderCreator = () => {
        return (<View>
            <FlatList
                data={this.state.passes}
                renderItem={this.renderCreatorPass} />
            <Button
                loading={this.state.submitting} 
                disabled={this.state.submitting}
                rounded={true} 
                backgroundColor={'lime'} 
                title='SELECT RIDE'
                onPress={this.onOpenRideSelector}
                containerViewStyle={{ margin: 10 }}
                disabledStyle={{
                    backgroundColor: Theme.DISABLED_BACKGROUND
                }}
                disabledTextStyle={{
                    color: Theme.DISABLED_FOREGROUND
                }} />
            <Divider style={{ backgroundColor: 'green', marginBottom: 20 }} />
        </View>);
    }

    render() {
        return (<View style={{
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignContent: 'center',
            width: '100%'
        }}>
            <View style={{
                width: '100%',
                backgroundColor: '#000000'
            }}>
                <Text style={{
                    fontSize: 30,
                    color: 'white',
                    textAlign: 'center'
                }}>
                    Pass Groups
                </Text>
                {this.renderPassGroups()}
            </View>
            <View style={{
                width: '100%',
                backgroundColor: '#000000'
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignContent: 'center'
                }}>
                    <Icon
                    raised
                    name={"refresh"}
                    size={22}
                    color='blue'
                    onPress={this.refreshFastPasses} />
                    <Text style={{
                        fontSize: 30,
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        FastPasses
                    </Text>
                    <Icon
                    raised
                    name={(!this.state.showCreator)? "add": "remove"}
                    size={22}
                    color='green'
                    onPress={(!this.state.showCreator)? this.showFastPassCreator: this.hideFastPassCreator} />
                </View>
                <Collapsible 
                    collapsed={!this.state.showCreator}>
                    {this.renderCreator()}
                </Collapsible>
                <View style={{
                    width: '100%',
                    height: this.state.height,
                    backgroundColor: '#111111'
                }}>
                    {
                        this.state.allTransactions.map(this.renderTransaction)
                    }
                </View>
            </View>
        </View>);
    }
};
