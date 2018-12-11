import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';


export default class RideLists extends React.Component {
    static navigationOptions = {
        title: 'Rides',
        header: null
    };

    constructor(props) {
        super();
    }

    openRide = (ride) => {
        //TODO: Open ride activity
    }

    onRidePressed = (ride) => {
        if (this.props.selectedRides == null) {
            this.openRide(ride);
        } else {
            var selectedRides = this.props.selectedRides;
            if (selectedRides[ride.key] != null) {
                delete selectedRides[ride.key];
            } else {
                selectedRides[ride.key] = true;
            }
            if (Object.keys(selectedRides).length == 0) {
                selectedRides = null;
            }
            this.props.onSelectedRidesChanged(selectedRides);
        }
    }
    
    onRideLongPressed = (ride) => {
        var selectedRides = this.props.selectedRides;
        if (selectedRides == null) {
            selectedRides = {};
        }
        selectedRides[ride.key] = true;
        this.props.onSelectedRidesChanged(selectedRides);
    }

    renderRide = (ride) => {
        if (!ride.visible) {
            return null;
        }
        var fontSize = 18;
        var cardStyle = {
            width: "100%", 
            flex: 1, 
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: '#444444',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (ride.selected) {
            cardStyle.backgroundColor = "#0080ff";
        } else if (ride.rating != null) {
            cardStyle.backgroundColor = `hsl(${Math.round((ride.rating * 120)/10)}, 100%, 50%)`
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
                                    {(ride.waitMins != null)? ride.waitMins: ride.status}
                                </Text>
                            </View>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                    {(ride.fastPassTime != null)? ride.fastPassTime: "--"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        return (
            <ImageCacheProvider>
                <FlatList
                    data={this.props.rides}
                    renderItem={({item}) => this.renderRide(item)} />
            </ImageCacheProvider>);
    }
};
