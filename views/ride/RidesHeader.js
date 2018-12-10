import React from 'react';
import { View } from 'react-native';
import { Icon, SearchBar } from 'react-native-elements';
import Theme from '../../Theme';

export default class RidesHeader extends React.Component {
    constructor(props) {
        super();
        this.state = {
            rideQuery: '',
            showDateTimeModal: false,
            showDateTimeBar: false
        };
    }

    //TODO: Launch Calendar activity
    showCalendar = () => {
        
    }
    
    toggleDateTimeBar = () => {
        this.setState({
            showDateTimeBar: !this.state.showDateTimeBar
        });
    }

    onRideQueryChanged = (rideQuery) => {
        this.setState({
            rideQuery: rideQuery
        });
        this.props.onRideQueryChanged(rideQuery);
    }

    render() {
        var clearIcon = (this.state.rideQuery != null && this.state.rideQuery.length > 0)? { name: 'close', style: { width: 30, height: 30, marginLeft: 3, marginTop: -7, fontSize: 30, alignSelf: "center" } }: null;
        return (
        <View style={{ flex: 1, flexDirection: "column" }}>
            <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center' }}>
                <SearchBar 
                    placeholder="Rides"
                    icon={{ name: 'search', style: { fontSize: 25, height: 25, marginTop: -4  } }}
                    clearIcon={clearIcon}
                    value={this.state.rideQuery}
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
                    onChangeText={(value) => { this.onRideQueryChanged(value) }}
                    onClearText={() => { this.onRideQueryChanged("") }} />
                <View style={{ 
                    width: "15%", 
                    height: 58, 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignContent: 'center', 
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    borderBottomColor: "rgba(0, 0, 0, 0.3)",
                    borderBottomWidth: 2 }}>
                    <Icon
                        name={(this.state.showDateTimeBar != null)? 'av-timer': 'date-range'}
                        size={40}
                        color={Theme.PRIMARY_FOREGROUND}
                        onPress={() => { 
                            if (this.state.showDateTimeBar) {
                                this.setState({ showDateTimeModal: true });
                            } else {
                                this.showCalendar();
                            }
                        }}  />
                </View>
                <View style={{ 
                    width: "15%", 
                    height: 58, 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignContent: 'center', 
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    borderBottomColor: "rgba(0, 0, 0, 0.3)",
                    borderBottomWidth: 2 }}>
                    <Icon
                        name={(!this.state.showDateTimeBar)? 'access-time': 'close'}
                        size={40}
                        color={Theme.PRIMARY_FOREGROUND}
                        onPress={() => {
                            this.toggleDateTimeBar();
                        }} />
                </View>
            </View>
            {
                (this.state.showDateTimeBar != null)?
                    (<View />): null
            }
        </View>);
    }
};
