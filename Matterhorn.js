import React from 'react';
import { StyleSheet, Text, View, Image, TextInput, Dimensions } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Fade from './utils/Fade';

var background = require('./assets/rides/matterhorn/background.png');
var subTitle = require('./assets/rides/matterhorn/subTitle.png');
var title = require('./assets/rides/matterhorn/title.png');
var mountain = require('./assets/rides/matterhorn/mountain.png');
var waterfall = require('./assets/rides/matterhorn/waterfall.png');
var foreground = require('./assets/rides/matterhorn/foreground.png');
var sled = require('./assets/rides/matterhorn/sled.png');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    }
});

const theme = {
    Button: {
      titleStyle: {
        color: 'red',
      },
    },
  };

export default class Matterhorn extends React.Component {
    static navigationOptions = {
        title: 'Matterhorn',
        header: null
    };

    constructor(props) {
        super();
    }

    render() {
        const { classes } = this.props;
        var width = Dimensions.get('window').width;
        var height = Dimensions.get('window').height;
        var imgWidth = width;
        var imgHeight = width * 1.5022;
        var s = (
                <View style={{ width: width }}>
                    <Image source={background} style={{ left: 0, top: 0, width: width, position: "absolute", resizeMode: 'contain' }} />
                    <Image source={mountain} style={{ left: 0, top: width * 0.0784, width: width * 0.70, position: "absolute", resizeMode: 'contain' }} />
                    <Image source={foreground} style={{ width: width, resizeMode: 'cover' }} />
                    <Image source={sled} style={{ left: width * 0.04, top: width * 0.58, width: width * 0.60, position: "absolute", resizeMode: 'contain' }} />
                    <Image source={subTitle} style={{ left: width * 0.04, top: width * 0.125, width: width * 0.29, position: "absolute", resizeMode: 'contain' }} />
                    <Image source={title} style={{ left: 0, top: 0, width: width * 0.965, position: "absolute", resizeMode: 'contain' }} />
                </View>
            );

        return (
            <View style={{ width: imgWidth, height: imgHeight }}>
                <Image source={background} style={{ left: 0, top: 0, width: width, position: "absolute", resizeMode: 'cover' }} />
                <Image source={mountain} style={{ left: 0, top: imgHeight * 0.09, width: width * 0.70, position: "absolute", resizeMode: 'cover' }} />
                <Image source={waterfall} style={{ left: imgWidth * 0.74, top: imgHeight * 0.129, width: width * 0.227, position: "absolute", resizeMode: 'cover' }} />
                <Image source={waterfall} style={{ left: imgWidth * 0.74, top: imgHeight * 0.129, width: width * 0.227, position: "absolute", resizeMode: 'cover' }} />
                <Image source={foreground} style={{ left: 0, top: 0, width: imgWidth, position: "absolute", resizeMode: 'cover' }} />
                <Image source={sled} style={{ left: imgWidth * 0.0345, top: imgHeight * 0.645, width: imgWidth * 0.60, position: "absolute", resizeMode: 'cover' }} />
                <Image source={subTitle} style={{ left: width * 0.04, top: imgHeight * 0.125, width: width * 0.29, position: "absolute", resizeMode: 'contain' }} />
                <Image source={title} style={{ left: 0, top: 0, width: width * 0.965, position: "absolute", resizeMode: 'contain' }} />
            </View>
        );
    }
};
