import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Dimensions,
    Slider,
    TouchableWithoutFeedback } from 'react-native';
import { Icon, FormInput } from 'react-native-elements';
import { RNCamera } from 'react-native-camera';
import Theme from '../../Theme';
import { Immersive } from 'react-native-immersive';

const flashModeOrder = {
    auto: 'off',
    off: 'on',
    on: 'auto'
};

const landmarkSize = 2;

export default class Camera extends React.Component {
    static navigationOptions = {
        title: 'Camera',
        header: null,
    };

    constructor(props) {
        super(props);

        this.state = {
            flash: 'off',
            zoom: 0,
            autoFocus: 'on',
            autoFocusPoint: {
                normalized: { x: 0.5, y: 0.5 }, // normalized values required for autoFocusPointOfInterest
                drawRectPosition: {
                    x: Dimensions.get('window').width * 0.5 - 32,
                    y: Dimensions.get('window').height * 0.5 - 32,
                },
            },
            depth: 0,
            type: 'back',
            whiteBalance: 'auto',
            ratio: '16:9',
            recordOptions: {
                mute: false,
                maxDuration: 960,
                quality: RNCamera.Constants.VideoQuality['480p'],
            },
            isRecording: false,
            immersive: false,
            portrait: true
        }
    }

    componentWillMount() {
        Immersive.on();
        Immersive.setImmersive(true);
    }

    componentWillUnmount() {
        Immersive.off();
        Immersive.setImmersive(false);
    }

    onOrientationChanged = () => {
        this.setState({
            portrait: !this.state.portrait
        });
    }

    toggleFacing = () => {
        this.setState({
            type: this.state.type === 'back' ? 'front' : 'back',
        });
    }

    toggleFlash = () => {
        this.setState({
            flash: flashModeOrder[this.state.flash]
        });
    }

    touchToFocus = (event) => {
        const { pageX, pageY } = event.nativeEvent;
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const isPortrait = screenHeight > screenWidth;
    
        let x = pageX / screenWidth;
        let y = pageY / screenHeight;
        // Coordinate transform for portrait. See autoFocusPointOfInterest in docs for more info
        if (isPortrait) {
            x = pageY / screenHeight;
            y = -(pageX / screenWidth) + 1;
        }
    
        this.setState({
            autoFocusPoint: {
                normalized: { x, y },
                drawRectPosition: { x: pageX, y: pageY },
            },
        });
    }

    showDarkScreen = () => {
        this.setState({
            immersive: true
        });
    }

    hideDarkScreen = () => {
        this.setState({
            immersive: false
        });
    }
    
    zoomOut = () => {
        this.setState({
            zoom: this.state.zoom - 0.1 < 0 ? 0 : this.state.zoom - 0.1,
        });
    }
    
    zoomIn = () => {
        this.setState({
            zoom: this.state.zoom + 0.1 > 1 ? 1 : this.state.zoom + 0.1,
        });
    }
    
    takePicture = async () => {
        if (this.camera) {
            const data = await this.camera.takePictureAsync();
            console.warn('takePicture ', data);
        }
    };
    
    takeVideo = async () => {
        if (this.camera) {
            try {
                const promise = this.camera.recordAsync(this.state.recordOptions);

                if (promise) {
                    this.recordCamera = this.camera;
                    this.setState({ isRecording: true });
                    const data = await promise;
                    this.setState({ isRecording: false });
                    console.warn('takeVideo', data);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    stopVideo = () => {
        this.camera.stopRecording();
    }

    renderCamera() {
        var flashIconName = null;
        if (this.state.flash == 'on') {
            flashIconName = 'flash-on';
        } else if (this.state.flash == 'off') {
            flashIconName = 'flash-off';
        } else if (this.state.flash == 'auto') {
            flashIconName = 'flash-auto';
        }
        const drawFocusRingPosition = {
            top: this.state.autoFocusPoint.drawRectPosition.y - 32,
            left: this.state.autoFocusPoint.drawRectPosition.x - 32,
        };

        var iconSize = 40;
        return (
        <RNCamera
            ref={ref => {
                this.camera = ref;
            }}
            style={{
                flex: 1,
                justifyContent: 'space-evenly'
            }}
            type={this.state.type}
            flashMode={this.state.flash}
            autoFocus={this.state.autoFocus}
            autoFocusPointOfInterest={this.state.autoFocusPoint.normalized}
            zoom={this.state.zoom}
            whiteBalance={this.state.whiteBalance}
            ratio={this.state.ratio}
            focusDepth={this.state.depth}
            permissionDialogTitle={'Permission to use camera'}
            permissionDialogMessage={'We need your permission to use your camera phone'}
        >
            <View style={StyleSheet.absoluteFill}>
                {
                    (this.state.immersive)? (
                        <TouchableOpacity style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "black",
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            left: 0,
                            top: 0
                        }}
                        onPress={this.hideDarkScreen}>
                            <Icon
                                raised
                                color='#333333'
                                containerStyle={{
                                    backgroundColor: '#111111'
                                }}
                                name={(this.state.isRecording)? 'stop': 'camera'}
                                onPress={(this.state.isRecording)? this.stopVideo: this.takeVideo}
                                size={80}
                                />
                        </TouchableOpacity>): (
                            <View style={{
                                flex: 1
                            }}>
                                <View style={{
                                    width: "100%",
                                    flexDirection: 'row',
                                    justifyContent: 'space-evenly',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                                }}>
                                    <Icon
                                    color='#FFFFFF'
                                    name={(this.state.type == 'front')? 'camera-rear': 'camera-front'}
                                    onPress={this.toggleFacing}
                                    size={iconSize}
                                    />
                                    <Icon
                                    color='#FFFFFF'
                                    name={flashIconName}
                                    onPress={this.toggleFlash}
                                    size={iconSize}
                                    />
                                </View>
                                <View style={[styles.autoFocusBox, drawFocusRingPosition]} />
                                <TouchableWithoutFeedback onPress={this.touchToFocus}>
                                    <View style={{ flex: 1 }} />
                                </TouchableWithoutFeedback>
                                <View style={{
                                    width: "100%",
                                    flexDirection: 'row',
                                    justifyContent: 'space-evenly',
                                    alignItems: 'center',
                                }}>
                                    <Icon
                                    raised
                                    color='#FFFFFF'
                                    containerStyle={{
                                        backgroundColor: 'red'
                                    }}
                                    name={(this.state.isRecording)? 'fullscreen': 'fiber-manual-record'}
                                    onPress={(!this.state.isRecording)? this.takeVideo: this.showDarkScreen}
                                    size={iconSize / 1.7}
                                    />
                                    <Icon
                                    raised
                                    color='#FFFFFF'
                                    containerStyle={{
                                        backgroundColor: 'red'
                                    }}
                                    name={(this.state.isRecording)? 'stop': 'camera'}
                                    onPress={(!this.state.isRecording)? this.takePicture: this.stopVideo}
                                    size={iconSize / 1.2}
                                    />
                                    <Icon
                                    raised
                                    color='#FFFFFF'
                                    disabledStyle={{
                                        backgroundColor: 'black'
                                    }}
                                    disabledTextStyle={{
                                        color: 'gray'
                                    }}
                                    containerStyle={{
                                        backgroundColor: 'red'
                                    }}
                                    name={'rotate-right'}
                                    size={iconSize / 1.7}
                                    onPress={this.onOrientationChanged}
                                    disabled={this.state.isRecording}
                                    />
                                </View>
                            </View>
                        )
                }
            </View>
        </RNCamera>
        );
    }

    render() {
        return (<View style={styles.container}>
            {this.renderCamera()}
        </View>);
    }
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 10,
      backgroundColor: '#000',
    },
    flipButton: {
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
      justifyContent: 'center',
    },
    autoFocusBox: {
      position: 'absolute',
      height: 64,
      width: 64,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'white',
      opacity: 0.4,
    },
    flipText: {
      color: 'white',
      fontSize: 15,
    },
    zoomText: {
      position: 'absolute',
      bottom: 70,
      zIndex: 2,
      left: 2,
    },
    picButton: {
      backgroundColor: 'darkseagreen',
    },
    facesContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: 0,
      top: 0,
    },
    face: {
      padding: 10,
      borderWidth: 2,
      borderRadius: 2,
      position: 'absolute',
      borderColor: '#FFD700',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    landmark: {
      width: landmarkSize,
      height: landmarkSize,
      position: 'absolute',
      backgroundColor: 'red',
    },
    faceText: {
      color: '#FFD700',
      fontWeight: 'bold',
      textAlign: 'center',
      margin: 10,
      backgroundColor: 'transparent',
    },
    text: {
      padding: 10,
      borderWidth: 2,
      borderRadius: 2,
      position: 'absolute',
      borderColor: '#F00',
      justifyContent: 'center',
    },
    textBlock: {
      color: '#F00',
      position: 'absolute',
      textAlign: 'center',
      backgroundColor: 'transparent',
    },
  });