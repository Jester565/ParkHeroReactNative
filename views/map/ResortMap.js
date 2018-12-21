import React, { Component } from 'react';
import { Animated, StyleSheet, Dimensions, Image, View } from 'react-native';
import DynmaicImage from './DynamicImage';

import {
  PanGestureHandler,
  PinchGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';
import DynamicImage from './DynamicImage';
import LargeImage from './LargeImage';

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
        this._totalW = 10000;
        this._totalH = 10000;
        this._deviceW = Dimensions.get('window').width;
        this._deviceH = Dimensions.get('window').height;
        this._scaleValue = 1;
        this._x = 1500;
        this._y = 1500;
        this._animOffset = { x: 0, y: 0 };
        this._lastOffset = { x: 0, y: 0 };
        this._totalOffset = { x: 0, y: 0 }
        this._translateX = new Animated.Value(0);
        this._translateY = new Animated.Value(0);
        this._translateX.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this._animOffset.x = value - this._lastOffset.x;
            this._totalOffset.x = value;
            this.forceUpdate();
        });

        this._translateY.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this._animOffset.y = value - this._lastOffset.y;
            this._totalOffset.y = value;
            this.forceUpdate();
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
            if (this._pinchPoint == null) {
                this._pinchPoint = {
                    x: this._focalPoint.x,
                    y: this._focalPoint.y
                };
            }
            this._scaleValue = this._lastScale * value;
            //var currentX = this.props.x / this.props.viewScale + (this.props.totalW * (this.props.viewScale - 1.0) / 2.0) / this.props.viewScale
            //var touchX = (this._pinchPoint.x - currentX)
            
            //var xValue = this._totalW * (value - 1.0) / (2.0 * value);
            //var yValue = this._totalH * (value - 1.0) / (2.0 * value);
            //this._translateX.setValue(xValue);
            //this._translateY.setValue(yValue);
            var xValue = ((this._totalW / 2 - this._deviceW / 2) + this._lastOffset.x) * value - ((this._totalW / 2 - this._deviceW / 2) + this._lastOffset.x);
            var yValue = ((this._totalH / 2 - this._deviceH / 2) + this._lastOffset.y) * value - ((this._totalH / 2 - this._deviceH / 2) + this._lastOffset.y);
            //var alteredX = this._lastOffset.x / this._scaleValue + (this._totalW * (this._scaleValue - 1.0) / 2.0) / this._scaleValue;
            //var diffX = (this._focalPoint.x - alteredX) * (1 / this._scaleValue) - (this._focalPoint.x - alteredX);

            //console.log("X: ", this._pinchPoint.x - 1500, this._lastOffset.x, " : ", (this._pinchPoint.x - 1500 - this._lastOffset.x) * (1 - scale));
            this._translateX.setValue(xValue);
            this._translateY.setValue(yValue);
            /*
            var scale = value;
            console.log("OFFSETY: ", this._lastOffset.y, " : ", this._focalPoint.y);
            var xValue = (this._focalPoint.x - 1500 - this._lastOffset.x) / scale  - this._lastOffset.x;
            console.log("XVALUE: ", xValue);
            //var yValue = (-this._focalPoint.y) - this._lastOffset.y;
            this._translateX.setValue(xValue);
            //this._translateY.setValue(yValue);
            */
           this.forceUpdate();
        });
        this._scale = Animated.multiply(this._baseScale, this._pinchScale);
        this._focalX = new Animated.Value(0);
        this._focalY = new Animated.Value(0);
        this._focalX.addListener(( {value} ) => {
            this._focalPoint.x = value;
        });
        this._focalY.addListener(( {value} ) => {
            this._focalPoint.y = value;
        });
        this._lastScale = 1;
        this._focalPoint = { x: 0, y: 0 };
        this._pinchPoint = null;
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
            this._pinchPoint = null;
            /*
            var xValue = (this._lastOffset.x / this._scaleValue - this._totalW * (this._scaleValue - 1.0) / (2.0 * this._scaleValue));
            var yValue = (this._lastOffset.y / this._scaleValue - this._totalH * (this._scaleValue - 1.0) / (2.0 * this._scaleValue));
            this._translateX.setOffset(xValue);
            this._translateY.setOffset(yValue);
            */
            var xValue = ((this._totalW / 2 - this._deviceW / 2) + this._lastOffset.x) * event.nativeEvent.scale - (this._totalW / 2 - this._deviceW / 2);
            var yValue = ((this._totalH / 2 - this._deviceH / 2) + this._lastOffset.y) * event.nativeEvent.scale - (this._totalH / 2 - this._deviceH / 2);
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
                                <Animated.View style={{ position: 'absolute', width: 10000, height: 10000, transform: [ { translateX: this._translateX },
                                    { translateY: this._translateY }, { scale: this._scale } ] }}>
                                    <LargeImage
                                        x={-this._totalOffset.x}
                                        y={-this._totalOffset.y}
                                        viewScale={this._scaleValue}
                                        totalW={this._totalW}
                                        totalH={this._totalH} 
                                        visibleW={this._deviceW}
                                        visibleH={this._deviceH} />
                                </Animated.View>
                </PinchGestureHandler>
            </PanGestureHandler>
        );
    }
}