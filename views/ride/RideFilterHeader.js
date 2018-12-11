import React from 'react';
import { View,  } from 'react-native';
import { Icon, SearchBar } from 'react-native-elements';
import Theme from '../../Theme';

export default class RideFilterHeader extends React.Component {
    constructor(props) {
        super();
    }

    render() {
        return (<View style={{ flex: 1, flexDirection: "column" }}>
            <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center' }}>
                <View style={{ 
                    width: "15%", 
                    height: 58, 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignContent: 'center', 
                    backgroundColor: '#0040CC',
                    borderBottomColor: "rgba(0, 0, 255, 0.3)",
                    borderBottomWidth: 2 }}>
                    <Icon
                        name={'close'}
                        size={40}
                        color={Theme.PRIMARY_FOREGROUND}
                        onPress={() => {
                            this.props.onFilterEditCancelled();
                        }} />
                </View>
                <SearchBar 
                    noIcon
                    placeholder="Filter Name"
                    value={this.props.filterID}
                    containerStyle={{
                        width: "70%",
                        height: 58,
                        backgroundColor: '#0040CC',
                        borderBottomColor: "rgba(0, 0, 255, 0.3)",
                        borderBottomWidth: 2,
                        borderTopWidth: 0
                    }}
                    inputStyle={{
                        marginLeft: 15,
                        paddingTop: 0,
                        paddingBottom: 0,
                        fontSize: 22,
                        backgroundColor: '#004099',
                        color: Theme.PRIMARY_FOREGROUND
                    }}
                    onChangeText={(value) => { this.props.onFilterIDChanged(value) }}
                    onClearText={() => { this.props.onFilterIDChanged("") }} />
                <View style={{
                    width: "15%", 
                    height: 58, 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignContent: 'center', 
                    backgroundColor: '#0040CC',
                    borderBottomColor: "rgba(0, 0, 255, 0.3)",
                    borderBottomWidth: 2 }}>
                    <Icon
                        name={(this.props.filters != null && this.props.filters[this.props.filterID] != null)? 'save': 'add'}
                        size={40}
                        color={(this.props.filterID.length > 0)? Theme.PRIMARY_FOREGROUND: 'black'}
                        disabled={this.props.filterID.length == 0}
                        onPress={() => {
                            this.props.onSaveFilter();
                        }} />
                </View>
            </View>
        </View>);
    }
};
