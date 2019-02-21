import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import RideRow from './RideRow';


export default class RideList extends React.Component {
    static navigationOptions = {
        title: 'Rides',
        header: null
    };

    constructor(props) {
        super();
    }

    onRidePressed = (rideID) => {
        if (this.props.selectedRides == null) {
            this.props.openRide(rideID);
        } else {
            var selectedRides = this.props.selectedRides;
            if (selectedRides[rideID] != null) {
                delete selectedRides[rideID];
            } else {
                selectedRides[rideID] = true;
            }
            if (Object.keys(selectedRides).length == 0) {
                selectedRides = null;
            }
            this.props.onSelectedRidesChanged(selectedRides);
        }
    }
    
    onRideLongPressed = (rideID) => {
        var selectedRides = this.props.selectedRides;
        if (selectedRides == null) {
            selectedRides = {};
        }
        selectedRides[rideID] = true;
        this.props.onSelectedRidesChanged(selectedRides);
    }

    renderRide = (ride) => {
        return <RideRow
            id={ride.id}
            visible={ride.visible}
            selected={ride.selected}
            waitTime={ride.waitTime}
            fastPassTime={ride.fastPassTime}
            waitRating={ride.waitRating}
            status={ride.status}
            name={ride.name}
            picUrl={ride.picUrl}
            onLongPress={this.onRideLongPressed}
            onPress={this.onRidePressed} />
    }

    render() {
        return (
        <FlatList
            data={this.props.rides}
            renderItem={({item}) => this.renderRide(item)} />)
    }
};
