import React from 'react';
import { View, AppState, Text, TouchableOpacity } from 'react-native';
import { Icon, SearchBar } from 'react-native-elements';
import Theme from '../../Theme';
import RidesDateTimeSelector from './RidesDateTimeSelector';
import moment from 'moment';

export default class RidesHeader extends React.Component {
    constructor(props) {
        super();
        this.REFRESH_MESSAGE_INTERVAL = 30000;

        this.state = {
            rideQuery: '',
            showDateTimeModal: false,
            showDateTimeBar: false,
            refreshMessage: (props.lastRefresh != null)? this.getRefreshMessage(props.lastRefresh): null
        };
    }

    componentWillMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
    }

    handleAppStateChange = () => {
        if (this.refreshMessageUpdater != null && (nextAppState == 'background' || nextAppState == 'inactive') && this.appState == 'active') {
            clearInterval(this.refreshMessageUpdater);
        } else if (nextAppState == 'active' && (this.appState == 'background' || this.appState == 'inactive')) {
            if (this.props.lastRefresh != null) {
                this.updateRefreshMessage();
                this.refreshMessageUpdater = setInterval(this.updateRefreshMessage, this.REFRESH_MESSAGE_INTERVAL);
            }
        }
        this.appState = nextAppState;
    }

    updateRefreshMessage = (lastRefresh) => {
        if (lastRefresh == null) {
            lastRefresh = this.props.lastRefresh;
        }
        var refreshMessage = this.getRefreshMessage(lastRefresh);
        this.setState({
            refreshMessage: refreshMessage
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.lastRefresh != this.props.lastRefresh) {
            if (this.refreshMessageUpdater != null) {
                clearInterval(this.refreshMessageUpdater);
            }
            this.updateRefreshMessage(newProps.lastRefresh);
            this.refreshMessageUpdater = setInterval(this.updateRefreshMessage, this.REFRESH_MESSAGE_INTERVAL);
        }
    }

    getRefreshMessage(lastRefresh) {
        var refreshTimeStr = lastRefresh;
        var refreshMessage = null;
        if (refreshTimeStr == null) {
            refreshMessage = "Not Up To Date";
        } else {
            var refreshTime = moment(refreshTimeStr);
            var duration = moment.duration(moment().diff(refreshTime));
            var hours = Math.trunc(duration.asHours());
            var minutes = Math.trunc(duration.asMinutes());
            var seconds = Math.trunc(duration.asSeconds());
            if (hours > 24) {
                refreshMessage = `Not Up To Date`;
            } else if (hours > 0) {
                refreshMessage = `${hours} Hour${(hours > 1)? 's': ''} Ago`;
            } else if (minutes > 0) {
                refreshMessage = `${minutes} Min${(minutes > 1)? 's': ''} Ago`;
            } else if (seconds >= 30) {
                refreshMessage = `${seconds} Secs Ago`;
            } else {
                refreshMessage = `Up To Date`;
            }
        }
        return refreshMessage;
    }

    //TODO: Launch Calendar activity
    showCalendar = () => {
        
    }
    
    toggleDateTimeBar = () => {
        if (this.state.showDateTimeBar) {
            this.props.onDateTimeChanged(null);
        }
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

    renderRefreshTime = () => {
        return (<View style={{
            width: "100%",
            flexDirection: 'row',
            justifyContent: 'flex-end',
            flex: 1
        }}>
            <TouchableOpacity style={{
                backgroundColor: Theme.SECONDARY_BACKGROUND,
                borderColor: 'rgba(0, 0, 0, 0.3)',
                borderWidth: 2,
                borderBottomLeftRadius: 10,
                marginRight: -3,
                padding: 4,
                marginBottom: 15
            }}
            onPress={this.props.onReqRefresh}>
                <Text style={{
                    fontSize: 19,
                    color: Theme.PRIMARY_FOREGROUND
                }}>
                    {this.state.refreshMessage}
                </Text>
            </TouchableOpacity>
        </View>);
    };

    render() {
        var clearIcon = (this.state.rideQuery != null && this.state.rideQuery.length > 0)? { name: 'close', style: { width: 30, height: 30, marginLeft: 3, marginTop: -7, fontSize: 30, alignSelf: "center" } }: null;
        var refreshTime = (!this.props.refreshing && this.state.refreshMessage && !this.state.showDateTimeBar)? this.renderRefreshTime(): null;
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
                        name={(this.state.showDateTimeBar)? 'av-timer': 'date-range'}
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
            { refreshTime }
            {
                (this.state.showDateTimeBar)?
                    (<RidesDateTimeSelector 
                        schedules={this.props.schedules}
                        onDateTimeChanged={this.props.onDateTimeChanged}
                        showDateTimeModal={this.state.showDateTimeModal}
                        onDateTimeModalClosed={() => {
                            this.setState({
                                showDateTimeModal: false
                            })
                        }}
                    />): null
            }
        </View>);
    }
};
