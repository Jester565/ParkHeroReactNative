import React from 'react';
import { Image, View, RefreshControl, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Theme from '../../Theme';
import moment from 'moment';

export default class RidesParallax extends React.Component {
    constructor(props) {
        super(props);
        this.parkImages = [
            [require('../../assets/castle.jpg'), require('../../assets/castleFront.png')],
            [require('../../assets/pier.jpg'), require('../../assets/pierFront.png')]
        ];
        this.state = {
            isMapOpen: false
        };
        this.parallaxHeaderHeight = new Animated.Value(358);
    }

    renderParkInfo = (parkSchedule) => {
        if (parkSchedule != null) {
            var parkName = parkSchedule["parkName"];
            var openTime = moment(parkSchedule["openTime"], 'HH:mm:ss');
            var closeTime = moment(parkSchedule["closeTime"], 'HH:mm:ss');
            var openTimeStr = openTime.format('h:mm A');
            var closeTimeStr = closeTime.format('h:mm A');
            var parkNameBottomBorderRadius = (parkName.length > 15)? 15: 0;
            var parkHoursTopBorderRadius = (15 - parkNameBottomBorderRadius) * 0.66;
            return (<View style={{ 
                flex: 1, 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center'
            }}>
                <Text style={{ 
                    fontSize: 24, 
                    padding: 5, 
                    color: Theme.PRIMARY_FOREGROUND, 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    borderTopLeftRadius: 15, 
                    borderTopRightRadius: 15,
                    borderBottomLeftRadius: parkNameBottomBorderRadius,
                    borderBottomRightRadius: parkNameBottomBorderRadius }}>{parkName}</Text>
                <Text style={{ 
                    fontSize: 18, 
                    padding: 5, 
                    color: Theme.PRIMARY_FOREGROUND, 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    borderTopRightRadius: parkHoursTopBorderRadius,
                    borderTopLeftRadius: parkHoursTopBorderRadius,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10 }}>{openTimeStr} - {closeTimeStr}</Text>
            </View>);
        } else {
            return (<ActivityIndicator size="large" color="#cccccc" />);
        }
    }
    
    toggleMap = () => {
        var screenHeight = Dimensions.get('window').height;
        this.setState({
            isMapOpen: !this.state.isMapOpen
        }, () => {
            Animated.timing(
                this.parallaxHeaderHeight,
                {
                    toValue: (this.state.isMapOpen)? screenHeight: 358,
                    duration: 200
                }
            ).start();
            this.refs._scrollView.scrollTo({ y: 0, animated: true });
        });
    }

    renderScheduleBar = (parkSchedules, weather) => {
        if (weather != null) {
            var temp = weather["feelsLikeF"];
        }
        var dayRating = null;
        if (parkSchedules != null) {
            dayRating = 0;
            for (var parkSchedule of parkSchedules) {
                dayRating += parkSchedule.crowdLevel;
            }
            dayRating /= parkSchedules.length;
        }
        return (<View style={{
            width: '100%', 
            flex: 1, 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center'
        }}>
            { (temp != null)?
                (<View style={{
                    borderTopRightRadius: 20,
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    width: 60,
                    paddingTop: 10,
                    paddingBottom: 15
                }}>
                    <Text style={{ color: Theme.PRIMARY_FOREGROUND, fontSize: (temp.toString().length > 2)? 25: 30, textAlign: "center" }}>{temp}&deg;</Text>
                </View>): <View />
            }
            { (dayRating != null)?
                (<View style={{
                    borderTopLeftRadius: 20,
                    backgroundColor: Theme.PRIMARY_BACKGROUND,
                    width: 60,
                    paddingTop: 10,
                    paddingBottom: 15
                }}>
                    <Text style={{ color: Theme.PRIMARY_FOREGROUND, fontSize: 30, textAlign: "center" }}>{dayRating.toFixed(1)}</Text>
                </View>): <View />
            }
        </View>)
    }

    renderMap = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        return (
            <View style={{
                width: screenWidth,
                height: screenHeight
            }}>
                {this.props.renderMap()}
                <View style={{ position: 'absolute', right: 0, bottom: 75, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                    <Icon
                    name="list"
                    color={Theme.PRIMARY_FOREGROUND}
                    size={40}
                    onPress={this.toggleMap}
                    containerStyle={{ 
                        backgroundColor: "rgba(59, 59, 59, 0.8)", 
                        borderColor: "rgba(255, 255, 255, 0.3)", 
                        padding: 5, 
                        borderRadius: 50, 
                        borderWidth: 2 
                    }} />
                </View>
            </View>
        );
    }

    renderForeground = () => {
        var parkSchedule = null;
        if (this.props.parkSchedules != null) {
            parkSchedule = this.props.parkSchedules[this.props.parkI];
        }

        return (<View style={{ width: "100%", height: 370 }}>
            <View style={{ width: "100%", height: 370, flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                <View>{ this.renderParkInfo(parkSchedule) }</View>
            </View>
            <View style={{ position: "absolute", width: "100%", left: 0, bottom: 0 }}>
                { this.renderScheduleBar(this.props.parkSchedules, this.props.weather) }
            </View>
            { (this.props.parkI > 0)?
                (<View style={{ position: 'absolute', left: 0, bottom: 0, height: '80%', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    <Icon
                        name="navigate-before"
                        color={Theme.PRIMARY_FOREGROUND}
                        size={40}
                        onPress={() => { this.props.onParkIChanged(this.props.parkI - 1) }}
                        containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "rgba(255, 255, 255, 0.3)", padding: 5, borderRadius: 50, borderWidth: 2 }} />
                </View>): null
            }
            { (this.props.parkI < this.parkImages.length - 1)?
                (<View style={{ position: 'absolute', right: 0, bottom: 0, height: '80%', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    <Icon
                        name="navigate-next"
                        color={Theme.PRIMARY_FOREGROUND}
                        size={40}
                        onPress={() => { this.props.onParkIChanged(this.props.parkI + 1) }}
                        containerStyle={{ backgroundColor: "rgba(59, 59, 59, 0.8)", borderColor: "rgba(255, 255, 255, 0.3)", padding: 5, borderRadius: 50, borderWidth: 2 }} />
                </View>): null
            }
            <View style={{ position: 'absolute', right: 0, bottom: 25, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                <Icon
                    name="map"
                    color={Theme.PRIMARY_FOREGROUND}
                    size={40}
                    onPress={this.toggleMap}
                    containerStyle={{ 
                        backgroundColor: "rgba(59, 59, 59, 0.8)", 
                        borderColor: "rgba(255, 255, 255, 0.3)", 
                        padding: 5, 
                        borderRadius: 50, 
                        borderWidth: 2 }} />
            </View>
        </View>);
    }

    render() {
        var screenHeight = Dimensions.get('window').height;
        
        var backgroundSrc = this.parkImages[this.props.parkI][0];
        var foregroundSrc = this.parkImages[this.props.parkI][1];
        return (<ParallaxScrollView
            ref="_scrollView"
            refreshControl={(!this.state.isMapOpen)? (
                <RefreshControl
                    refreshing={this.props.refreshing}
                    onRefresh={this.props.onRefresh}
                    progressViewOffset={35}
                />): null
            }
            backgroundColor={Theme.PRIMARY_BACKGROUND}
            contentBackgroundColor={Theme.SECONDARY_BACKGROUND}
            parallaxHeaderHeight={(this.state.isMapOpen)? screenHeight: 358}
            stickyHeaderHeight={110}
            parallaxBackgroundScrollSpeed={30}
            fadeOutForeground={false}
            renderFixedHeader={this.props.renderHeader} 
            scrollEnabled={!this.state.isMapOpen}
            renderBackground={() => (<View>
                    <View style={{ width: "100%", height: 350, marginTop: 58 }} >
                        <View>
                            <Image style={{ width: "100%", height: "100%" }} source={backgroundSrc} />
                            <Image style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "100%" }} source={foregroundSrc} />
                        </View>
                    </View>
                </View>
            )}
            renderForeground={(!this.state.isMapOpen)? this.renderForeground: this.renderMap}>
                { this.props.children }
        </ParallaxScrollView>);
    }
};
