import React, { Component } from 'react';
import { View, Image } from 'react-native';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import { PermissionsAndroid } from 'react-native';

export default class LargeImage extends Component {
    constructor(props) {
        super(props);
        this.HIGHEST_SCALE = 4;
        this.HIGHEST_SCALE_COUNT = 11;
        this.markerRadius = 50;

        this.state = {
            latitude: null,
            longitude: null
        }
    }

    componentWillMount() {
        PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    'title': 'ParkHero Location Permission',
                    'message': 'Used to update wait times and map navigation'
                }
            ).then((granted) => {
                if (granted) {
                    this.watchID = navigator.geolocation.watchPosition(
                        (position) => {
                            this.setState({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            });
                        },
                        (error) => console.error("WatchPosition Failed: ", error),
                        { enableHighAccuracy: true });
                }
            })
    }

    componentWillUnmount() {
        if (this.watchID != null) {
            navigator.geolocation.stopObserving(this.watchID);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        var scale = (this.HIGHEST_SCALE / nextProps.viewScale) / 2;
        var truncScale = Math.trunc(scale);
        if (truncScale > this.HIGHEST_SCALE) {
            truncScale = this.HIGHEST_SCALE;
        }
        if (truncScale != this.truncScale) {
            return true;
        }

        var dimSize = (Math.pow(2, this.HIGHEST_SCALE - truncScale) * this.HIGHEST_SCALE_COUNT);

        var x = nextProps.x / nextProps.viewScale + (nextProps.totalW * (nextProps.viewScale - 1.0) / 2.0) / nextProps.viewScale;
        var y = nextProps.y / nextProps.viewScale + (nextProps.totalH * (nextProps.viewScale - 1.0) / 2.0) / nextProps.viewScale;
        
        var rowOffset = Math.trunc((y / nextProps.totalH) * dimSize);
        var colOffset = Math.trunc((x / nextProps.totalW) * dimSize);
        return (rowOffset != this.rowOffset || colOffset != this.colOffset);
    }

    toPixels(latitude, longitude) {
        var y = (((latitude - 33.80557) * -35.25 + 0.5555078125) * this.props.totalH / 2) * 1.136;
        var x = (((longitude - (-117.918677)) * 29.25 + 0.25037109375) * this.props.totalW / 2) * 1.136;
        console.log("X: ", x, "LONG: ", longitude);
        console.log("Y: ", y, "LAT: ", latitude);
        return {
            x: x,
            y: y
        }
    }

    render() {
        var scale = (this.HIGHEST_SCALE / this.props.viewScale) / 2;
        this.truncScale = Math.trunc(scale);
        if (this.truncScale > this.HIGHEST_SCALE) {
            this.truncScale = this.HIGHEST_SCALE;
        }
        var scaleStr = this.truncScale.toString();
        if (scaleStr.length == 1) {
            scaleStr = "0" + scaleStr;
        }
        var dimSize = (Math.pow(2, this.HIGHEST_SCALE - this.truncScale) * this.HIGHEST_SCALE_COUNT);

        var visibleWScaled = this.props.visibleW / this.props.viewScale;
        var visibleHScaled = this.props.visibleH / this.props.viewScale;
        var x = this.props.x / this.props.viewScale + (this.props.totalW * (this.props.viewScale - 1.0) / 2.0) / this.props.viewScale;
        var y = this.props.y / this.props.viewScale + (this.props.totalH * (this.props.viewScale - 1.0) / 2.0) / this.props.viewScale;
        
        var images = [];
        this.rowOffset = Math.trunc((y / this.props.totalH) * dimSize);
        this.colOffset = Math.trunc((x / this.props.totalW) * dimSize);
        for (var rowI = -1; rowI < (visibleWScaled / this.props.totalH) * dimSize + 4; rowI++) {
            for (var colI = -1; colI < (visibleHScaled / this.props.totalW) * dimSize + 1; colI++) {
                var imgI = rowI + this.rowOffset;
                var imgIStr = imgI.toString();
                if (imgIStr.length == 1) {
                    imgIStr = "0" + imgIStr;
                }
                var imgJ = colI + this.colOffset;
                var imgJStr = imgJ.toString();
                if (imgJStr.length == 1) {
                    imgJStr = "0" + imgJStr;
                }
                var fileName = imgIStr + imgJStr + scaleStr + ".jpg";
                images.push(<CachedImage
                    key={fileName}
                    style={{
                        position: 'absolute',
                        left: ((imgJStr * this.props.totalW) / dimSize) / 2.0,
                        top: ((imgIStr * this.props.totalH) / dimSize) / 2.0,
                        width: this.props.totalW / dimSize + 1,
                        height: this.props.totalH / dimSize + 1
                    }}
                    source={{
                        uri: 'http://disneymap.s3-website-us-west-1.amazonaws.com/' + fileName
                    }}
                    activityIndicatorProps={{
                        color: "rgba(0, 0, 0, 0)"
                    }}
                    resizeMode={'contain'} />);
            }
        }

        var userMarker = null;
        if (this.state.latitude != null) {
            var userPixelPos = this.toPixels(this.state.latitude, this.state.longitude);
            if (userPixelPos.x >= 0 && userPixelPos.x < this.props.totalW / 2 && userPixelPos.y >= 0 && userPixelPos.y < this.props.totalH / 2) {
                userMarker = <View 
                    key={"userMarker"}
                    style={{
                        position: 'absolute',
                        left: userPixelPos.x,
                        top: userPixelPos.y,
                        width: this.markerRadius * 2,
                        height: this.markerRadius * 2,
                        
                        backgroundColor: 'red'
                    }}/>
            }
        }
        return (
                <View style={{
                    width: this.props.totalW,
                    height: this.props.totalH
                }}>
                    { images }
                    { userMarker }
                </View>
        );
    }
}