import React from 'react';
import { View, FlatList, Picker, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { Icon, Text } from 'react-native-elements';
import Theme from '../../Theme';
import RideFilterWatcher from './RideFilterWatcher';
var levenshtein = require('fast-levenshtein');

export default class RideFilters extends React.Component {
    constructor(props) {
        super();
        this.state = {
            editWatchFilterID: null,
            selectedFilters: null
        };
    }

    onEditWatch = (filter) => {
        this.setState({
            editWatchFilterID: filter.filterID
        });
    }

    onFilterPressed = (filter) => {
        if (this.state.selectedFilters == null) {
            var activeFilters = this.props.activeFilters;
            if (activeFilters == null) {
                activeFilters = {};
            }
            if (activeFilters[filter.filterID] == null) {
                activeFilters[filter.filterID] = true;
            } else {
                delete activeFilters[filter.filterID];
            }
            if (Object.keys(activeFilters).length == 0) {
                activeFilters = null;
            }
            this.props.onActiveFiltersChanged(activeFilters);
        } else {
            var selectedFilters = this.state.selectedFilters;
            if (selectedFilters[filter.filterID] == null) {
                selectedFilters[filter.filterID] = true;
            } else {
                delete selectedFilters[filter.filterID];
            }
            if (Object.keys(selectedFilters).length == 0) {
                selectedFilters = null;
            }
            this.setState({
                selectedFilters: selectedFilters
            });
        }
    }

    onFilterLongPressed = (filter) => {
        var selectedFilters = this.state.selectedFilters;
        if (selectedFilters == null) {
            selectedFilters = {};
        }
        selectedFilters[filter.filterID] = true;
        this.setState({
            selectedFilters: selectedFilters
        });
    }

    renderFilter = (filter) => {
        var cardStyle = {
            width: "100%", 
            flex: 1, 
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: '#449944',
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.state.selectedFilters != null && this.state.selectedFilters[filter.filterID] != null) {
            cardStyle.backgroundColor = "#0080FF";
        } else if (this.props.activeFilters != null && this.props.activeFilters[filter.filterID] != null) {
            cardStyle.backgroundColor = "#00BB00"
        } else {
            cardStyle.backgroundColor = "grey";
        }
        if (filter["notifyConfig"] != null) {
            cardStyle.borderColor = "#DDDDDD";
        }
        return (<TouchableOpacity
            onPress={() => { this.onFilterPressed(filter) }}
            onLongPress={() => { this.onFilterLongPressed(filter) }}>
            <View 
                elevation={10} 
                style={cardStyle}>
                <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }}>
                    <Text style={{ color: Theme.PRIMARY_FOREGROUND, fontSize: 25 }}>{filter.filterID}</Text>
                    <View style={{ position: 'absolute', top: 0, right: 0, flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center', color: Theme.PRIMARY_FOREGROUND }}>
                        <Icon
                            name="edit"
                            color={Theme.PRIMARY_FOREGROUND}
                            size={25}
                            containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "#333333", padding: 10, borderWidth: 2, marginTop: -8, marginRight: 20 }} 
                            onPress={() => { this.props.onEditFilters([ filter ]) }} />
                        {
                            (this.props.onWatch != null)? (<Icon
                                name={ 'visibility' }
                                color={Theme.PRIMARY_FOREGROUND}
                                size={25}
                                containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "#333333", padding: 10, marginTop: -8, borderWidth: 2 }}
                                onPress={() => { 
                                    this.onEditWatch(filter);
                                }} />): null
                        }
                    </View>
                </View>
            </View>
        </TouchableOpacity>);
    }

    render() {
        return <View style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "40%",
            flex: 1, 
            flexDirection: 'column', 
            justifyContent: 'flex-start', 
            alignContent: 'center',
            backgroundColor: Theme.PRIMARY_BACKGROUND
        }}>
            <Text style={{ color: Theme.PRIMARY_FOREGROUND, textAlign: 'center', fontSize: 30, marginTop: 5 }}>Order</Text>
            <View style={{ height: 40 }}>
                <View style={{ 
                    width: "100%", 
                    flex: 1, 
                    flexDirection: 'row', 
                    justifyContent: 'space-evenly', 
                    alignContent: 'center' }}>
                    {
                        (this.props.onSortModeChanged != null)? 
                        (<Picker
                            style={{ color: Theme.PRIMARY_FOREGROUND, width: 160, height: 40 }}
                            selectedValue={this.props.sortMode}
                            onValueChange={(itemValue) => { this.props.onSortModeChanged(itemValue) }}>
                            <Picker.Item label="Name" value="Name" />
                            <Picker.Item label="Rating" value="Rating" />
                            <Picker.Item label="Wait Time" value="Wait" />
                            <Picker.Item label="FastPass" value="FastPass" />
                            <Picker.Item label="Distance" value="Distance" />
                        </Picker>): null
                    }
                    <Switch
                        style={{ width: 50, height: 40, color: Theme.PRIMARY_FOREGROUND }}
                        thumbColor={Theme.PRIMARY_FOREGROUND}
                        value={this.props.sortAsc} 
                        onValueChange={(value) => { 
                            this.props.onSortAscChanged(value);
                        }} />
                </View>
            </View>
            <Text style={{ color: Theme.PRIMARY_FOREGROUND, textAlign: 'center', fontSize: 30 }}>Filters</Text>
            {
                (this.props.filters != null)? (
                    <FlatList style={{
                            width: "100%"
                        }}
                        data={ Object.values(this.props.filters) }
                        renderItem={({item}) => this.renderFilter(item)}></FlatList>
                ): <ActivityIndicator size="small" color="#cccccc" />
            }
            <Icon
                containerStyle={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, textAlign: 'center' }}
                name={'close'}
                size={40}
                color={Theme.PRIMARY_FOREGROUND}
                onPress={() => { 
                    this.props.onClose();
                }} />
            { (this.state.selectedFilters != null)? (
                <View style={{ height: 70 }}>
                    <View style={{ 
                        width: "100%", 
                        flex: 1, 
                        flexDirection: 'row', 
                        justifyContent: 'space-evenly', 
                        alignContent: 'center' }}>
                        <Icon
                            raised
                            name='close'
                            color='#0080FF'
                            containerStyle={{ backgroundColor: "#222222" }}
                            onPress={() => { this.setState({ selectedFilters: null }) }} />
                        <Icon
                            raised
                            name={ (Object.keys(this.state.selectedFilters).length > 1)? 'call-merge': 'edit' }
                            color='#0080FF'
                            containerStyle={{ backgroundColor: "#222222" }}
                            onPress={() => {
                                var selectedFilterIDArr = Object.keys(this.state.selectedFilters);
                                var filters = [];
                                for (var filterID of selectedFilterIDArr) {
                                    filters.push(this.props.filters[filterID]);
                                }
                                this.props.onEditFilters(filters);
                            }} />
                        <Icon
                            raised
                            name='delete'
                            color='#0080FF'
                            containerStyle={{ backgroundColor: "#222222" }}
                            onPress={() => { 
                                var selectedFilterIDArr = Object.keys(this.state.selectedFilters);
                                var filters = [];
                                for (var filterID of selectedFilterIDArr) {
                                    filters.push(this.props.filters[filterID]);
                                }
                                this.setState({
                                    selectedFilters: null
                                });
                                this.props.onDeleteFilters(filters);
                            }} />
                    </View>
                </View>): null
            }
            {
                (this.state.editWatchFilterID != null)? (
                    <RideFilterWatcher
                        filterID={this.state.editWatchFilterID}
                        notifyConfig={this.props.filters[this.state.editWatchFilterID].notifyConfig}
                        onWatch={this.props.onWatch}
                        onUnwatch={this.props.onUnwatch}
                        onClose={() => {
                            this.setState({
                                editWatchFilterID: null
                            })
                        }} />
                ): null
            }
        </View>
    }
};
