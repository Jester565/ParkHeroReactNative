import React from 'react';
import { StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import AwsExports from '../../AwsExports';
import Amplify, { Auth } from 'aws-amplify';
import Search from 'react-native-search-box';

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

const theme = {
    Button: {
      titleStyle: {
        color: 'red',
      }
    }  
  };

export default class RideList extends React.Component {
    static navigationOptions = {
        title: 'RideList',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            selectedRides: null,
            rideQuery: "",
            filterName: ""
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

    searchRides = (query) => {
        if (query.length == 0) {
            query = null;
        }
        this.setState({
            rideQuery: query
        });
    }

    clearRideSearch = () => {
        this.setState({
            rideQuery: null
        });
    }

    renderRide = (ride) => {
        var fontSize = 18;
        var cardStyle = Object.assign({}, styles.card);
        if (this.state.selectedRides != null && this.state.selectedRides[ride.key] != null) {
            console.log("BACKGROUND IS BLUE!");
            console.log("CARD STYLE: ", cardStyle);
            cardStyle.backgroundColor = "#0080ff";
            console.log("CARD2 STYLE: ", cardStyle);
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
        return (
            <View style={{backgroundColor: "#404040"}}>
                <Search
                    ref="search_box"
                    backgroundColor="#333333"
                    placeholderTextColor="#888888"
                    placeholder="Rides"
                    />
                <ImageCacheProvider>
                    <FlatList
                        data={[{key: '102002', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' }]}
                        renderItem={({item}) => this.renderRide(item)} />
                </ImageCacheProvider>
            </View>)
    }
};
