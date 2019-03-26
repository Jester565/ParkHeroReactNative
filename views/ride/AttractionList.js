import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import RideRow from './RideRow';


export default class AttractionList extends React.Component {
    onAttractionPressed = (attractionID) => {
        if (this.props.selectedAttractions == null) {
            this.props.openAttraction(attractionID);
        } else {
            var selectedAttractions = this.props.selectedAttractions;
            if (selectedAttractions[attractionID] != null) {
                delete selectedAttractions[attractionID];
            } else {
                selectedAttractions[attractionID] = true;
            }
            if (Object.keys(selectedAttractions).length == 0) {
                selectedAttractions = null;
            }
            this.props.onSelectedAttractionsChanged(selectedAttractions);
        }
    }
    
    onAttractionLongPressed = (attractionID) => {
        var selectedAttractions = this.props.selectedAttractions;
        if (selectedAttractions == null) {
            selectedAttractions = {};
        }
        selectedAttractions[attractionID] = true;
        this.props.onSelectedAttractionsChanged(selectedAttractions);
    }

    renderAttraction = ({item}) => {
        return this.props.renderAttraction(item, this.onAttractionPressed, this.onAttractionLongPressed);
    }

    render() {
        return (
        <FlatList
            data={this.props.attractions}
            renderItem={this.renderAttraction} />)
    }
};
