import React from 'react';
import { StyleSheet, Text, View, Image, TextInput, Dimensions } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Fade from '../utils/Fade';
import * as Animatable from 'react-native-animatable';

Animatable.initializeRegistryWithDefinitions({
    slideInDownLeft: {
      from: { translateY: -15, translateX: -15 },
      to: { translateY: 0, translateX: 0 }
    },
  });

var background = require('../../assets/rides/matterhorn/background.png');
var subTitle = require('../../assets/rides/matterhorn/subTitle.png');
var title = require('../../assets/rides/matterhorn/title.png');
var mountain = require('../../assets/rides/matterhorn/mountain.png');
var waterfall = require('../../assets/rides/matterhorn/waterfall.png');
var foreground = require('../../assets/rides/matterhorn/foreground.png');
var sled = require('../../assets/rides/matterhorn/sled.png');

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
    

    componentDidMount() {
        var imgHeight = this.props.width * 1.5022;
        this.stepI = 0;
        setInterval(() => {
            if (this.translateWaterfalls(imgHeight, this.stepI)) {
                this.stepI++;
            }
        }, 1000);
    }

    translateWaterfalls = (imgHeight, i) => {
        if (this.waterfall == null || this.waterfall2 == null) {
            return false;
        }
        if (i == 0) {
            this.waterfall.transitionTo({ top: imgHeight * 0.61 }, 1000, "linear");
        }
        if (i % 2 == 0) {
            this.waterfall2.transition({ top: imgHeight * -0.36 }, { top: imgHeight * 0.61 }, 2000, "linear");
        } else if (i % 1 == 0) {
            this.waterfall.transition({ top: imgHeight * -0.36 }, { top: imgHeight * 0.61 }, 2000, "linear");
        }
        return true;
    }

    render() {
        var width = this.props.width;
        var imgWidth = width;
        var imgHeight = width * 1.5022;
        var bounceDuration = 2000;
       
        return (
            <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center' 
            }}>
                <Image
                source={background}
                style={{position: 'absolute', left: 0, top: 0, width: "100%", height: "100%" }}
                blurRadius={10} />
                <View style={{ width: imgWidth, height: imgHeight }}>
                    <Image 
                        source={background} 
                        style={{ left: 0, top: 0, width: width, height: width * 0.9066, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image 
                        animation="bounceInRight" iterationCount={1} direction="alternate" duration={bounceDuration}
                        source={mountain} 
                        style={{ left: 0, top: imgHeight * 0.09, width: width * 0.70, height: width * 0.70 * 0.828, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image 
                        source={waterfall} 
                        ref={ (component) => {
                            this.stepI = 0;
                            this.waterfall = component;
                        }} 
                        style={{ left: imgWidth * 0.74, top: imgHeight * 0.129, width: width * 0.227, height: width * 0.227 * 3.3, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image 
                        source={waterfall} 
                        ref={ (component) => {
                            this.stepI = 0;
                            this.waterfall2 = component;
                        }} 
                        style={{ left: imgWidth * 0.74, top: imgHeight * -0.35, width: width * 0.227, height: width * 0.227 * 3.3, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Image 
                        source={foreground} 
                        style={{ left: 0, top: 0, width: width, height: width * 1.5, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image 
                        animation="slideInDownLeft" iterationCount={1000} duration={1000} direction="alternate"
                        source={sled} 
                        style={{ left: imgWidth * 0.06, top: imgHeight * 0.6, width: width * 0.60, height: width * 0.60 * 1.05, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image 
                        animation="bounceInLeft" iterationCount={1} direction="alternate" duration={bounceDuration}
                        source={subTitle} 
                        style={{ left: width * 0.04, top: imgHeight * 0.125, width: width * 0.29, height: width * 0.29 * 0.21, position: "absolute" }}
                        resizeMode={"stretch"} />
                    <Animatable.Image
                        animation="bounceInDown" iterationCount={1} direction="alternate" duration={bounceDuration}
                        source={title} 
                        style={{ left: 0, top: 0, width: width * 0.965, height: width * 0.965 * 0.207, position: "absolute" }}
                        resizeMode={"stretch"} />
                </View>
            </View>
        );
    }
};
