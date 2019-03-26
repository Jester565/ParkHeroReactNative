import React from 'react';
import { View, Text } from 'react-native';
import { Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import moment from 'moment';
import AwsExports from '../../AwsExports';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import WaitTimeChart from './WaitTimeChart';
import FastPassChart from './FastPassChart';
import NetManager from '../../NetManager';
import AttractionWrapper from './AttractionWrapper';

Amplify.configure(AwsExports);

export default class Ride extends React.Component {
    static navigationOptions = {
        title: 'Ride',
        header: null
    };

    constructor(props) {
        super();
        const { navigation } = props;
        var ride = navigation.getParam('ride', {
            id: "15510732",
            name: 'Alice in Wonderland',
            officialName: 'Alice in Wonderland',
            picUrl: 'rides/15510732',
            officialPicUrl: 'rides/15510732',
            customPicUrls: ['rides/15510732', 'rides/15575069'],
            waitTime: 20,
            waitRating: 4.523,
            fastPassTime: '13:25:00',
            status: 'Closed',
            land: 'Frontierland, Disneyland',
            height: '48 in, 120 cm',
            labels: 'Action, Adventure, Excitement, Teens, Scary, Family'
        });

        var dateStr = navigation.getParam('date', null);
        var date = moment(dateStr, "YYYY-MM-DD");

        this.state = {
            ride: ride,
            date: date,
            dps: null
        }

        this.rideDPsPromises = {};
        this.rideDPs = {};
    }

    componentWillMount() {
        this.netSubToken = NetManager.subscribe(this.handleNet);
    }

    handleNet = (event) => {
        if (event == "netSignIn") {
            this.updateRideDPs(this.state.ride.id, this.state.date);
        }
    }

    componentWillUnmount() {
        NetManager.unsubscribe(this.netSubToken);
    }

    updateRideDPs = (rideID, date) => {
        var dateStr = date.format("YYYY-MM-DD");
        if (this.rideDPsPromises[dateStr] != null) {
            var rideDPs = this.rideDPs[dateStr];
            if (rideDPs != null) {
                this.setRideDPs(rideDPs);
            }
        } else {
            this.rideDPsPromises[dateStr] = this.refreshRideDPs(rideID, date);
        }
    }

    refreshRideDPs = (rideID, date) => {
        var dateStr = date.format("YYYY-MM-DD");
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(queries.getRideDPs, { rideID: rideID, date: dateStr })).then((data) => {
                var rideDPs = data.data.getRideDPs;
                console.log("RESULT: ", JSON.stringify(rideDPs));
                this.rideDPs[dateStr] = rideDPs;
                if (this.state.date.format("YYYY-MM-DD") == dateStr) {
                    this.setRideDPs(rideDPs);
                }
            });
        });
    }

    setRideDPs = (rideDPs) => {
        if (rideDPs != null && rideDPs.length > 0) {
            this.setState({
                dps: rideDPs[0].dps,
                rideCloseDateTime: rideDPs[0].rideCloseDateTime
            });
        }
    }

    getRide = () => {
        return this.state.ride;
    }

    render() {
        const { navigation } = this.props;
        
        var ride = this.getRide();
        
        var fontSize = 30;

        var shouldRenderWaitTimes = (this.state.dps != null);
        var shouldRenderFastPasses = (this.state.dps != null && this.state.ride.labels.indexOf("FASTPASS") >= 0);
        return (
        <AttractionWrapper
            attraction={this.state.ride}
            onAttractionUpdate={navigation.getParam('onRideUpdate')}>
            <View>
                <View style={{ width: "100%", flex: 1, flexDirection: 'row', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 4, borderColor: 'rgba(0, 0, 0, .4)' }}>
                    <View style={{
                        flex: 1, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRightWidth: (ride.fastPassTime != null)? 4: 0, 
                        borderColor: 'rgba(0, 0, 0, 0.4)'}}>
                        <Text style={{textAlign: 'center', fontSize: fontSize * 1.3, color: Theme.PRIMARY_FOREGROUND }}>
                            {(ride.waitTime != null)? ride.waitTime: ride.status}
                        </Text>
                        {
                            (ride.waitTime != null)? (
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                                    Minute Wait
                                </Text>
                            ): null
                        }
                    </View>
                    {
                        (ride.fastPassTime != null)? (
                            <View style={{ flex: 2, alignItems: 'center' }}>
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND, fontWeight: 'bold' }}>
                                    FastPasses For
                                </Text>
                                <Text style={{ textAlign: 'center', fontSize: fontSize, color: Theme.PRIMARY_FOREGROUND }}>
                                    {(ride.fastPassTime != null)? moment(ride.fastPassTime, 'HH:mm:ss').format('h:mm A'): "--"}
                                </Text>
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                                    Are Being Distributed
                                </Text>
                            </View>
                        ): null
                    }
                </View>
                <View style={{ width: "100%", flexDirection: 'row', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 4, borderColor: 'rgba(0, 0, 0, .4)' }}>
                    <View 
                    style={{ flex: 1, 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        borderRightWidth: 4, 
                        borderColor: 'rgba(0, 0, 0, 0.4)' }}>
                        <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                            Wait Rating
                        </Text>
                        <Text style={{ textAlign: 'center', fontSize: fontSize, color: Theme.PRIMARY_FOREGROUND }}>
                            {(ride.waitRating != null)? ride.waitRating.toFixed(1): "--"}
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                            Height
                        </Text>
                        <Text style={{ textAlign: 'center', fontSize: fontSize, color: Theme.PRIMARY_FOREGROUND }}>
                            {(ride.height != null)? ride.height: "--"}
                        </Text>
                    </View>
                </View>
                <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 4, borderColor: 'rgba(0, 0, 0, .4)' }}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                            Location
                        </Text>
                        <Text style={{textAlign: 'center', fontSize: fontSize, color: Theme.PRIMARY_FOREGROUND }}>
                            {ride.land}
                        </Text>
                    </View>
                </View>
                <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: (shouldRenderWaitTimes != null)? 4: 0, borderColor: 'rgba(0, 0, 0, .4)' }}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                            Labels
                        </Text>
                        <Text style={{textAlign: 'center', fontSize: fontSize, color: Theme.PRIMARY_FOREGROUND }}>
                            {ride.labels}
                        </Text>
                    </View>
                </View>
                {
                    (shouldRenderWaitTimes)? (
                        <View style={{
                            width: "100%", 
                            flexDirection: 'column', 
                            alignContent: 'center', 
                            height: 400,
                            marginBottom: 15, 
                            paddingBottom: 15, 
                            borderBottomWidth: (shouldRenderFastPasses)? 4: 0, 
                            borderColor: 'rgba(0, 0, 0, .4)'
                        }}>
                            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                                    Wait Times
                                </Text>
                            </View>
                            <WaitTimeChart dps={this.state.dps} />
                        </View>
                    ): null
                }
                {
                    (shouldRenderFastPasses)? (
                        <View style={{
                            height: 400,
                            width: "100%", 
                            flexDirection: 'column',
                            alignContent: 'center'
                        }}>
                            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.7, color: Theme.PRIMARY_FOREGROUND}}>
                                    FastPass Times
                                </Text>
                            </View>
                            <FastPassChart dps={this.state.dps} rideCloseDateTime={this.state.rideCloseDateTime} />
                        </View>
                    ): null
                }
            </View>
        </AttractionWrapper>);
    }
};
