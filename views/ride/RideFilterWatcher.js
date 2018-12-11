import React from 'react';
import { Modal, TouchableWithoutFeedback, TouchableOpacity, TextInput, View } from 'react-native';
import { Icon, Text } from 'react-native-elements';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Theme from '../../Theme';

export default class RideFilterWatcher extends React.Component {
    constructor(props) {
        super();
        
        this.state = {
            rating: '',
            wait: '',
            fastPass: ''
        };
    }

    componentWillMount() {
        this.setFields(this.props.notifyConfig);
    }

    componentWillReceiveProps(newProps) {
        this.setFields(newProps.notifyConfig);
    }

    setFields = (notifyConfig) => {
        getNotifyConfigValue = (key) => {
            return (notifyConfig != null && notifyConfig[key] != null)? (notifyConfig[key]).toString(): ''
        }
        var watchFastPass = getNotifyConfigValue('fastPassTime');
        if (watchFastPass.length > 0) {
            watchFastPass = moment(watchFastPass, 'HH:mm:ss').format('h:mm A');
        }
        this.setState({
            rating: getNotifyConfigValue('waitRating'),
            wait: getNotifyConfigValue('waitTime'),
            fastPass: watchFastPass,
            showFastPassModal: false
        });
    }

    onWatch = () => {
        var fastPassTime = (this.state.fastPass.length > 0)? moment(this.state.fastPass, 'h:mm A').format('HH:mm:ss'): null;
        var notifyConfig = {
            waitRating: (this.state.rating.length > 0)? this.state.rating: null,
            waitTime: (this.state.wait.length > 0)? this.state.wait: null,
            fastPassTime: fastPassTime
        };
        this.props.onWatch(this.props.filterID, notifyConfig);
        this.props.onClose();
    }

    render() {
        return (<View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={true}
                onRequestClose={() => {
                    this.props.onClose();
                }}>
                <TouchableOpacity style={{
                    flex: 1,
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                }}
                onPress={() => { this.props.onClose() }}>
                    <TouchableWithoutFeedback>
                        <View style={{
                            width: "80%",
                            height: 500,
                            paddingTop: 10,
                            paddingLeft: 30,
                            paddingRight: 30,
                            paddingBottom: 30,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            backgroundColor: Theme.PRIMARY_BACKGROUND
                        }}>
                            <Text style={{
                                color: Theme.PRIMARY_FOREGROUND,
                                fontSize: 35,
                                textAlign: 'center'
                            }}>{this.props.filterID}</Text>
                            
                            <Text style={{ color: (this.state.rating.length > 0)? Theme.PRIMARY_FOREGROUND: 'black', fontSize: 25 }}>Rating</Text>
                            <TextInput
                                style={{
                                    color: Theme.PRIMARY_FOREGROUND,
                                    backgroundColor: '#222222',
                                    fontSize: 20
                                }}
                                keyboardType='numeric'
                                value={this.state.rating}
                                onChangeText={(value) => { this.setState({ rating: value }); }} />
                                
                            <Text style={{ color: (this.state.wait.length > 0)? Theme.PRIMARY_FOREGROUND: 'black', fontSize: 25 }}>Wait Time</Text>
                            <TextInput
                                style={{
                                    color: Theme.PRIMARY_FOREGROUND,
                                    backgroundColor: '#222222',
                                    fontSize: 20
                                }}
                                keyboardType='numeric'
                                value={this.state.wait}
                                onChangeText={(value) => { this.setState({ wait: value.toString() }) }} />

                            <Text style={{ color: (this.state.fastPass.length > 0)? Theme.PRIMARY_FOREGROUND: 'black', fontSize: 25 }}>FastPass</Text>
                            <View>
                                <Text
                                    style={{
                                        color: Theme.PRIMARY_FOREGROUND,
                                        backgroundColor: '#222222',
                                        fontSize: 20,
                                        width: "100%",
                                        paddingTop: 13,
                                        paddingLeft: 5,
                                        height: 50
                                    }}
                                    onPress={() => {
                                        this.setState({
                                            showFastPassModal: true
                                        })
                                    }}>
                                    {this.state.fastPass}
                                </Text>
                                {
                                    (this.state.fastPass.length > 0)?
                                    (<Icon
                                        name="close"
                                        color={Theme.PRIMARY_FOREGROUND}
                                        size={40}
                                        containerStyle={{ position: 'absolute', right: 0, bottom: 3 }} 
                                        onPress={() => { this.setState({
                                            fastPass: ''
                                        }) }} />): null
                                }
                            </View>
                            <View style={{
                                width: "100%",
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'space-evenly',
                                alignItems: 'center'
                            }}>
                                {
                                    (this.props.notifyConfig != null)? (
                                        <Icon
                                            raised
                                            name='visibility-off'
                                            color='#FF8000'
                                            containerStyle={{ backgroundColor: "#222222" }}
                                            onPress={() => {
                                                this.props.onUnwatch(this.props.filterID);
                                                this.props.onClose();
                                            }} />
                                    ): null
                                }
                                <Icon
                                    raised
                                    name='visibility'
                                    color={(this.state.rating.length != 0 || this.state.wait.length != 0 || this.state.fastPass.length != 0)? '#00BB80': 'black'}
                                    containerStyle={{ backgroundColor: "#222222" }}
                                    disabled={(this.state.rating.length == 0 && this.state.wait.length == 0 && this.state.fastPass.length == 0)}
                                    onPress={() => {
                                        this.onWatch();
                                    }} />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
            <DateTimePicker
                isVisible={this.state.showFastPassModal}
                onConfirm={(selectedTime) => { this.setState({ fastPass: moment(selectedTime).format('h:mm A'), showFastPassModal: false }) }}
                onCancel={() => { this.setState({ showFastPassModal: false }) }}
                mode="time"
                />
        </View>)
    }
};
