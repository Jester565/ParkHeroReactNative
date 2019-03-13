import React from 'react';
import { Animated, Image, View, RefreshControl, ActivityIndicator, BackHandler, Dimensions } from 'react-native';
import { Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Theme from '../../Theme';
import moment from 'moment';
import PassPager from './PassPager';

export default class RidesParallax extends React.Component {
    constructor(props) {
        super();

        this.state = {
            passExpanded: false
        }
    }

    componentWillMount() {
        var screenHeight = Dimensions.get('window').height;
        this.passOffset = new Animated.Value(-screenHeight + 150);
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }

    onExpand = () => {
        this.setState({
            passExpanded: true
        }, () => {
            Animated.timing(
                this.passOffset,
                {
                    toValue: 0,
                    duration: 200
                }
            ).start();
            this.refs._scrollView.scrollTo({ y: this.props.headerHeight, animated: true });
        });
    }

    handleBackPress = () => {
        var screenHeight = Dimensions.get('window').height;
        if (this.state.passExpanded) {
            this.setState({
                passExpanded: false
            }, () => {
                Animated.timing(
                    this.passOffset,
                    {
                        toValue: -screenHeight + 150,
                        duration: 200
                    }
                ).start();
                this.refs._scrollView.scrollTo({ y: 0, animated: true });
            });
            return true;
        }
        return false;
    }

    render() {
        return (<ParallaxScrollView
            ref='_scrollView'
            scrollEnabled={!this.state.passExpanded}
            backgroundColor={Theme.PRIMARY_BACKGROUND}
            contentBackgroundColor={Theme.SECONDARY_BACKGROUND}
            parallaxHeaderHeight={this.props.headerHeight}
            parallaxBackgroundScrollSpeed={30}
            renderBackground={this.props.renderHeaderBackground}
            renderForeground={this.props.renderHeaderForeground}>
                <PassPager 
                    passes={this.props.passes}
                    splitters={this.props.splitters}
                    onPress={this.onExpand}
                    expanded={this.state.passExpanded}
                    editingEnabled={this.props.editingEnabled}
                    splittingEnabled={this.props.splittingEnabled}
                    currentUserID={this.props.currentUserID}
                    passGroupID={this.props.passGroupID} />
                <Animated.View style={{
                    marginTop: this.passOffset
                }}>
                    { this.props.children }
                </Animated.View>
        </ParallaxScrollView>);
    }
};
