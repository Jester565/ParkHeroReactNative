import React, { Component } from 'react';
import { Animated, StyleSheet, Image, View } from 'react-native';

import {
  PanGestureHandler,
  PinchGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';

var USE_NATIVE_DRIVER = false;

const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    box: {
      width: 3000,
      height: 3000,
      alignSelf: 'center',
      backgroundColor: 'plum',
      margin: 10,
      zIndex: 200,
    },
  });

export default class ResortMap extends Component {
    static navigationOptions = {
        title: 'ResortMap',
        header: null
    };

    constructor(props) {
        super(props);
        this._animOffset = { x: 0, y: 0 };
        this._lastOffset = { x: 0, y: 0 };
        this._totalOffset = { x: 0, y: 0 }
        this._translateX = new Animated.Value(0);
        this._translateY = new Animated.Value(0);
        this._translateX.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this._animOffset.x = value - this._lastOffset.x;
            this._totalOffset.x = value - this._lastOffset.x;
        });

        this._translateY.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this._animOffset.y = value - this._lastOffset.y;
            this._totalOffset.y = value - this._lastOffset.y;
        });
        this._onGestureEvent = Animated.event(
            [
                {
                    nativeEvent: {
                        translationX: this._translateX,
                        translationY: this._translateY
                    },
                },
            ],
            { useNativeDriver: USE_NATIVE_DRIVER }
        );

        this._baseScale = new Animated.Value(1);
        this._pinchScale = new Animated.Value(1);
        this._pinchScale.addListener(( {value} ) => {
            var scale = value;
            var xValue = this._lastOffset.x * scale - this._lastOffset.x;
            var yValue = (1000 + this._lastOffset.y) * scale - (1000 + this._lastOffset.y);
            this._translateX.setValue(xValue);
            this._translateY.setValue(yValue);
        });
        this._scale = Animated.multiply(this._baseScale, this._pinchScale);
        this._focalX = new Animated.Value(0);
        this._focalY = new Animated.Value(0);
        this._focalX.addListener(( {value} ) => {
            console.log("FOCALX: ", value);
        })
        this._lastScale = 1;
        this._focalPoint = { x: 0, y: 0 };
        this._onPinchGestureEvent = Animated.event(
            [{ nativeEvent: { 
                scale: this._pinchScale,
                focalX: this._focalX,
                focalY: this._focalY } }],
            { useNativeDriver: USE_NATIVE_DRIVER }
        );
    }

    _onHandlerStateChange = event => {
        if (event.nativeEvent.oldState == 0) {
            this._translateX.stopAnimation(() => {
                this._lastOffset.x += this._animOffset.x;
                this._translateX.setOffset(this._lastOffset.x);
                this._translateX.setValue(0);
            });

            this._translateY.stopAnimation(() => {
                this._lastOffset.y += this._animOffset.y;
                this._translateY.setOffset(this._lastOffset.y);
                this._translateY.setValue(0);
            });
        }
        else if (event.nativeEvent.oldState === State.ACTIVE) {  
            this._lastOffset.x += event.nativeEvent.translationX;
            this._translateX.setOffset(this._lastOffset.x);
            this._translateX.setValue(0);

            this._lastOffset.y += event.nativeEvent.translationY;
            this._translateY.setOffset(this._lastOffset.y);
            this._translateY.setValue(0);
            
            Animated.decay(this._translateX,
                {
                    velocity: event.nativeEvent.velocityX / 2000.0,
                    deceleration: 0.99,
                    useNativeDriver: USE_NATIVE_DRIVER
                }).start()

            Animated.decay(this._translateY,
                {
                    velocity: event.nativeEvent.velocityY / 2000.0,
                    deceleration: 0.99,
                    useNativeDriver: USE_NATIVE_DRIVER
                }).start()
        }
    };

    _onPinchHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            this._lastScale *= event.nativeEvent.scale;
            this._baseScale.setValue(this._lastScale);
            this._pinchScale.setValue(1);
            var xValue = this._lastOffset.x * event.nativeEvent.scale;
            var yValue = (1000 + this._lastOffset.y) * event.nativeEvent.scale - 1000;
            this._translateX.setOffset(xValue);
            this._translateY.setOffset(yValue);
            this._translateX.setValue(0);
            this._translateY.setValue(0);
        }
    };

    render() {
        return (
            <PanGestureHandler
                {...this.props}
                onGestureEvent={this._onGestureEvent}
                onHandlerStateChange={this._onHandlerStateChange}
                minPointers={1}
                maxPointers={1}>
                <PinchGestureHandler
                    onGestureEvent={this._onPinchGestureEvent}
                    onHandlerStateChange={this._onPinchHandlerStateChange}>
                    <Animated.View
                        style={[
                            styles.box,
                            {
                                transform: [
                                    { translateX: this._translateX },
                                    { translateY: this._translateY }
                                ],
                            },
                            this.props.boxStyle
                        ]}>
                                <Animated.View style={{ transform: [ { scale: this._scale } ] }}>
                                    <Animated.Image style={{width: "100%", height: "100%" }} source={require('../../assets/mapTest.png')} />
                                </Animated.View>
                    </Animated.View>
                </PinchGestureHandler>
            </PanGestureHandler>
        );
    }
}