import React from 'react';
import { Image, View, RefreshControl, ActivityIndicator } from 'react-native';
import { Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Theme from '../../Theme';
import moment from 'moment';

export default class RidesParallax extends React.Component {
    constructor(props) {
        super();
        this.parkImages = [
            [require('../../assets/castle.jpg'), require('../../assets/castleFront.png')],
            [require('../../assets/pier.jpg'), require('../../assets/pierFront.png')]
        ]
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

    render() {
        var parkSchedule = null;
        if (this.props.parkSchedules != null) {
            parkSchedule = this.props.parkSchedules[this.props.parkI];
        }

        var backgroundSrc = this.parkImages[this.props.parkI][0];
        var foregroundSrc = this.parkImages[this.props.parkI][1];
        return (<ParallaxScrollView
            refreshControl={
                <RefreshControl
                    refreshing={this.props.refreshing}
                    onRefresh={this.props.onRefresh}
                    progressViewOffset={35}
                />
            }
            backgroundColor={Theme.PRIMARY_BACKGROUND}
            contentBackgroundColor={Theme.SECONDARY_BACKGROUND}
            parallaxHeaderHeight={358}
            stickyHeaderHeight={110}
            parallaxBackgroundScrollSpeed={30}
            fadeOutForeground={false}
            renderFixedHeader={() => {
                return this.props.renderHeader();
            }} 
            renderBackground={() => (<View>
                    <View style={{ width: "100%", height: 350, marginTop: 58 }} >
                        <View>
                            <Image style={{ width: "100%", height: "100%" }} source={backgroundSrc} />
                            <Image style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "100%" }} source={foregroundSrc} />
                        </View>
                    </View>
                </View>
            )}
            renderForeground={() => (
                <View style={{ width: "100%", height: 370 }}>
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
                </View>
            )}>
                { this.props.children }
        </ParallaxScrollView>);
    }
};
