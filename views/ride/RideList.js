import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import RideRow from './RideRow';


export default class RideList extends React.Component {
    
    renderRide = (ride, onPress, onLongPress) => {
        var waitTime = (!this.props.predicting)? ride.waitTime: ride.waitTimePrediction
        var waitRating = (!this.props.predicting)? ride.waitRating: 5;
        var status = (!this.props.predicting)? ride.status: "--";
        var fastPassTime = (!this.props.predicting)? ride.fastPassTime: ride.fastPassTimePrediction;
        var backgroundColor = null;
        if (ride.selected) {
            backgroundColor = "#0080ff";
        } else if (waitRating != null) {
            backgroundColor = `hsl(${Math.round((waitRating * 120)/10)}, 100%, 50%)`
        }
        return <AttractionRow
            id={ride.id}
            name={ride.name}
            signedPicUrl={ridesignedPicUrl}
            visible={ride.visible}
            selected={ride.selected}
            backgroundColor={backgroundColor}
            onPress={onPress}
            onLongPress={onLongPress}>
            <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{textAlign: 'center', fontSize: fontSize }}>
                        {(waitTime != null)? waitTime: status}
                    </Text>
                </View>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{textAlign: 'center', fontSize: fontSize}}>
                        {(fastPassTime != null)? moment(fastPassTime, 'HH:mm:ss').format('h:mm A'): "--"}
                    </Text>
                </View>
            </View>
        </AttractionRow>
    }

    render() {
        return (
        <FlatList
            data={this.props.attractions}
            renderItem={({item}) => this.renderAttraction(item)} />)
    }
};
