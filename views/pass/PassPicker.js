import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, BackHandler } from 'react-native';
import { Icon, FormInput } from 'react-native-elements';
import { RNCamera } from 'react-native-camera';
import Theme from '../../Theme';

var STATE_TO_COLOR = {
    "error": "red",
    "loading": "yellow",
    "added": "#7FFFD4"
}

export default class PassPicker extends React.Component {
    static navigationOptions = {
        title: 'PassPicker',
        header: null
    };

    constructor(props) {
        super(props);
        
        const { navigation } = props;
        var userPasses = navigation.getParam('passes', []);
        this.existingPassIDs = {};
        var passes = {};
        for (var pass of userPasses) {
            passes[pass.id] = {
                state: 'added',
                pass: pass
            };
            this.existingPassIDs[pass.id] = true;
        }
        this.state = {
            //current viewed barcodes
            barcodes: [],
            //scanned passes
            passes: passes,
            type: 'back',
            passID: '',
            manualPassModalOpen: false
        };
    }

    componentWillMount() {
        
    }

    componentWillUnmount() {
        
    }

    openManualPassModal = () => {
        this.setState({
            manualPassModalOpen: true
        });
    }

    closeManualPassModal = () => {
        if (this.state.manualPassModalOpen) {
            this.setState({
                manualPassModalOpen: false
            });
            return true;
        }
        return false;
    }

    barcodeRecognized = ({ barcodes }) => {
        var barcodeData = [];
        for (var barcode of barcodes) {
            barcodeData.push(barcode.data);
        }
        this.onBarcodes(barcodeData);
        this.setState({ 
            barcodes: barcodes 
        });
    }

    onBarcodes = (barcodes) => {
        var newPasses = {};
        for (var barcode of barcodes) {
            if (this.existingPassIDs[barcode] == null) {
                this.existingPassIDs[barcode] = true;
                newPasses[barcode] = {
                    state: 'loading',
                    time: Date.now()
                };
                const { navigation } = this.props;
                var onPick = navigation.getParam('onPick', null);
                onPick(barcode).then((userPass) => {
                    this.onPassAdded(barcode, userPass);
                }).catch((err) => {
                    this.onPassError(barcode);
                });
            }
        }
        if (Object.keys(newPasses).length > 0) {
            Object.assign(newPasses, this.state.passes);
            this.setState({ 
                passes: newPasses 
            });
        }
    }

    onPassAdded = (barcode, userPass) => {
        var newPasses = {};
        Object.assign(newPasses, this.state.passes);
        var pass = newPasses[barcode];
        pass["state"] = "added";
        pass["pass"] = userPass.pass;
        this.setState({
            passes: newPasses
        });
    }

    onPassError = (barcode) => {
        var newPasses = {};
        Object.assign(newPasses, this.state.passes);
        var pass = newPasses[barcode];
        pass["state"] = "error";
        this.setState({
            passes: newPasses
        });
    }

    renderBarcodes = () => (
        <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            top: 0
        }} pointerEvents="none">
        {this.state.barcodes.map(this.renderBarcode)}
        </View>
    );

    renderBarcode = ({ bounds, data, type }) => {
        var color = 'white';
        var displayData = data;
        var pass = this.state.passes[data];
        if (pass != null) {
            color = STATE_TO_COLOR[pass.state];
            if (pass.state == 'added' && pass.pass.name != null) {
                displayData = pass.pass.name;
            }
        }
        return (<React.Fragment key={data + bounds.origin.x}>
        <View
            style={[
            {
                padding: 10,
                borderWidth: 2,
                borderRadius: 2,
                position: 'absolute',
                borderColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
            },
            {
                ...bounds.size,
                left: bounds.origin.x,
                top: bounds.origin.y,
            }
            ]}
        >
            <Text style={{
                color: color,
                textAlign: 'center'
            }}>{displayData}</Text>
        </View>
        </React.Fragment>);
    }

    toggleFacing = () => {
        this.setState({
        type: this.state.type === 'back' ? 'front' : 'back',
        });
    }

    renderCamera() {
        return (
        <RNCamera
            ref={ref => {
            this.camera = ref;
            }}
            style={{
            flex: 1
            }}
            type={this.state.type}
            permissionDialogTitle={'Permission to use camera'}
            permissionDialogMessage={'We need your permission to use your camera phone'}
            onGoogleVisionBarcodesDetected={this.barcodeRecognized}
        >
            <View
            style={{
                flex: 0.5,
            }}
            >
            <View
                style={{
                backgroundColor: 'transparent',
                flexDirection: 'row',
                justifyContent: 'space-around',
                }}
            >
                <TouchableOpacity style={{
                    flex: 0.3,
                    height: 40,
                    marginHorizontal: 2,
                    marginBottom: 10,
                    marginTop: 10,
                    borderRadius: 8,
                    borderColor: 'white',
                    borderWidth: 1,
                    padding: 5,
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onPress={this.toggleFacing}>
                <Text style={{
                    color: 'white',
                    fontSize: 15
                }}> FLIP </Text>
                </TouchableOpacity>
            </View>
            </View>
            {this.renderBarcodes()}
        </RNCamera>
        );
    }

    onManualPassID = () => {
        if (this.state.passID.length > 0) {
            this.onBarcodes([this.state.passID]);
        }
    }

    render() {
        var passes = [];
        for (var passID in this.state.passes) {
            var pass = this.state.passes[passID];
            passes.push({
                key: passID,
                id: passID,
                state: pass.state.toUpperCase(),
                color: STATE_TO_COLOR[pass.state],
                name: (pass.pass)? pass.pass.name: null
            });
        }
        passes.sort((p1, p2) => {
            return p1.time - p2.time;
        });

        return (
        <View style={{
            width: "100%",
            height: "100%"
        }}>  
            <View style={{
                flex: 1,
                paddingTop: 10,
                backgroundColor: '#000'
            }}>{this.renderCamera()}</View>
            <Icon
                raised
                containerStyle={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'blue'
                }}
                name="text-fields"
                onPress={this.openManualPassModal}
                size={24}
                />
            <View
            style={{
                width: "100%",
                height: 100,
            }}>
                <FlatList
                data={passes}
                renderItem={({item}) => {
                    return (<View style={{
                        width: 150,
                        height: 90,
                        margin: 5,
                        backgroundColor: '#444444',
                        borderColor: 'black',
                        borderWidth: 2,
                        borderRadius: 5,
                        justifyContent: 'space-evenly',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            color: 'white'
                        }}>{item.id}</Text>
                        {
                            (item.name)? (
                                <Text style={{
                                    color: item.color
                                }}>{item.name}</Text>
                            ): 
                            <Text style={{
                                color: item.color
                            }}>{item.state}</Text>
                        }
                    </View>)
                }} 
                horizontal={true} />
            </View>

            <Modal
            animationType="slide"
            visible={this.state.manualPassModalOpen}
            onRequestClose={this.closeManualPassModal}>
                <View style={{
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    height: 300,
                    margin: "20%"
                }}>
                    <FormInput 
                        inputStyle={{ color: Theme.PRIMARY_FOREGROUND }}
                        placeholderTextColor={ Theme.DISABLED_FOREGROUND }
                        placeholder={"PassID"} 
                        value={this.state.username}
                        underlineColorAndroid={Theme.PRIMARY_FOREGROUND} 
                        blurOnSubmit={true} 
                        onChangeText={(value) => {this.setState({ "passID": value })}}
                        onSubmitEditing={this.onManualPassID} />
                    <Icon
                        raised
                        name="add"
                        containerStyle={{backgroundColor: 'green'}}
                        onPress={this.onManualPassID}
                        size={26} />
                </View>
            </Modal>
        </View>);
  }
};
