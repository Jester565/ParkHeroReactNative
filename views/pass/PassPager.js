import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, AppState, Dimensions } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import Collapsible from 'react-native-collapsible';
import AwsExports from '../../AwsExports';
import { PagerDotIndicator, IndicatorViewPager } from 'rn-viewpager';
import Barcode from 'react-native-barcode-builder';
import Theme from '../../Theme';
import moment from 'moment';
import * as Animatable from 'react-native-animatable';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import * as subscriptions from '../../src/graphql/subscriptions';
import Amplify, { API, graphqlOperation } from 'aws-amplify';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class PassPager extends React.Component {
    constructor(props) {
        super(props);
        
        this.lastPasses = props.passes;

        var passInfo = this.getFilteredPasses(props.passes, 
            props.splitters, 
            props.currentUserID,
            props.editing, 
            0);
        this.state = {
            passes: passInfo.passes,
            passI: passInfo.passI,
            editing: passInfo.showAll,
            splitting: passInfo.splitting,
            hasEnabledPasses: passInfo.hasEnabledPasses
        };

        this.ICON_SIZE = 26;
        this.PASS_HEIGHT = 150;
        this.FONT_SIZE = 14;
        this.ANIMATION_DURATION = 250;
    }

    componentWillMount() {
        if (this.props.groupID != null) {
            this.subToSplitters();
            AppState.addEventListener('change', this.handleAppStateChange);
        }
    }

    componentWillUnmount() {
        if (this.props.groupID != null) {
            this.unsubFromSplitters();
            AppState.removeEventListener('change', this.handleAppStateChange);
        }
    }

    handleAppStateChange = (nextAppState) => {
        if (this.splitSubscription == null && nextAppState == 'active' && (this.appState == 'background' || this.appState == 'inactive')) {
            this.subToSplitters();
        } else if (this.splitSubscription != null && (nextAppState == 'background' || nextAppState == 'inactive') && this.appState == 'active') {
            this.unsubFromSplitters();
        }
        this.appState = nextAppState;
    }

    subToSplitters = () => {
        this.splitSubscription = API.graphql(
            graphqlOperation(subscriptions.subUpdateSplitters, { groupID: this.props.groupID })
        ).subscribe({
            next: (data) => {
                console.log("DATA: ", JSON.stringify(data.value));
                var splitters = data.value.data.subUpdateSplitters.splitters;
                this.onSplitterUpdate(splitters);
            }
        });
    }

    unsubFromSplitters = () => {
        if (this.splitSubscription != null) {
            this.splitSubscription.unsubscribe();
            this.splitSubscription = null;
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.passes != this.lastPasses || newProps.splitters != this.props.splitters) {
            this.lastPasses = newProps.passes;

            var passInfo = this.getFilteredPasses(newProps.passes, 
                newProps.splitters, 
                newProps.currentUserID, 
                this.state.editing, 
                this.state.passI);
            this.setState({
                passes: passInfo.passes,
                passI: passInfo.passI,
                editing: passInfo.showAll,
                splitting: passInfo.splitting,
                hasEnabledPasses: passInfo.hasEnabledPasses
            });
        }
    }

    getSplitterI = (splitters, currentUserID) => {
        if (splitters != null) {
            for (var i = 0; i < splitters.length; i++) {
                if (splitters[i] == currentUserID) {
                    return i;
                }
            }
        }
        return -1;
    }

    getFilteredPasses = (inPasses, splitters, currentUserID, showAll, passI) => {
        var splitting = false;
        var resultShowAll = false;
        var hasEnabledPasses = false;
        var resultPasses = null;
        var passes = (inPasses != null)? inPasses: [];
        var sortedPasses = passes.slice().sort((a, b) => {
            return a.id.localeCompare(b.id);
        });
        var enabledPasses = [];
        for (var pass of sortedPasses) {
            if (pass.isEnabled) {
                enabledPasses.push(pass);
            }
        }
        hasEnabledPasses = (enabledPasses.length > 0);

        if (!showAll) {
            var splitterI = this.getSplitterI(splitters, currentUserID);
            if (splitterI >= 0) {
                splitting = true;
                var splitPasses = [];
                for (var i = splitterI * (enabledPasses.length / splitters.length); i < (splitterI + 1) * (enabledPasses.length / splitters.length); i++) {
                    if (i < enabledPasses.length) {
                        splitPasses.push(enabledPasses[i]);
                    }
                }
                resultPasses = splitPasses;
            } else if (enabledPasses.length > 0 || passes.length == 0) {
                resultPasses = enabledPasses;
            }
        }
        
        if (resultPasses == null) {
            resultPasses = sortedPasses;
            resultShowAll = true;
        }
        
        var resultPassI = passI;
        if (resultPasses == null || resultPasses.length == 0) {
            resultPassI = 0;
        } else if (resultPassI >= resultPasses.length) {
            resultPassI = resultPasses.length - 1;
        }
        return {
            passes: resultPasses,
            passI: resultPassI,
            showAll: resultShowAll,
            splitting: splitting,
            hasEnabledPasses: hasEnabledPasses
        };
    }

    onEdit = () => {
        var hidePromise = (this.state.splitting)? this.hideSplit(): this.hideNonEdit();
        hidePromise.then(() => {
            var passInfo = this.getFilteredPasses(
                this.props.passes, 
                this.props.splitters, 
                this.props.currentUserID, 
                true, 
                this.state.passI);
            this.setState({
                passes: passInfo.passes,
                passI: passInfo.passI,
                editing: passInfo.showAll
            }, () => {
                this.showEdit();
            });
        });
    }

    onHideEdit = () => {
        this.hideEdit().then(() => {
            var passInfo = this.getFilteredPasses(
                this.props.passes, 
                this.props.splitters, 
                this.props.currentUserID, 
                false, 
                this.state.passI);
            this.setState({
                passes: passInfo.passes,
                passI: passInfo.passI,
                editing: passInfo.showAll
            }, () => {
                if (this.state.splitting) {
                    this.showSplit();
                } else {
                    this.showNonEdit();
                }
            });
        });
    }

    onAdd = () => {
        this.props.navigation.navigate('PassPicker', {
            onPick: this.onReqAddPass,
            passes: this.state.passes
        });
    }

    onReqAddPass = (passID) => {
        return this.props.addPass(passID);
    }

    onReqRemovePass = () => {
        console.log("ON REQ REMOVE: ", this.state.passI);
        return this.props.removePass(this.state.passes[this.state.passI].id);
    }

    //Disable pass for any member of the party
    onDisable = () => {
        
    }

    //Enable pass for any member of the party
    onEnable = () => {

    }

    //Join the split
    onReqSplit = () => {
        this.updateSplitters("split");
    }

    //Current user leaves the split
    onReqUnsplit = () => {
        this.updateSplitters("unsplit");
    }
    
    //Unsplit passes across all users
    onReqMerge = () => {
        this.updateSplitters("merge");
    }

    updateSplitters = (action) => {
        API.graphql(graphqlOperation(mutations.updateSplitters, {
            groupID: this.props.groupID,
            action: action
        })).then((data) => {
            var splitters = data.data.updateSplitters.splitters;
            this.setState({
                splitters: splitters
            });
        });
    }

    onSplitterUpdate = (splitters) => {
        this.props.onSplitterUpdate(splitters.slice());
    }

    showNonEdit = () => {
        return this.refs._bottom.bounceInUp(this.ANIMATION_DURATION);
    }

    hideNonEdit = () => {
        return this.refs._bottom.bounceOutDown(this.ANIMATION_DURATION);
    }

    showEdit = () => {
        this.refs._visibilityPass.bounceInLeft(this.ANIMATION_DURATION);
        this.refs._removePass.bounceInRight(this.ANIMATION_DURATION);
        return this.refs._bottomEdit.bounceInUp(this.ANIMATION_DURATION);
    }

    hideEdit = () => {
        this.refs._visibilityPass.bounceOutLeft(this.ANIMATION_DURATION);
        this.refs._removePass.bounceOutRight(this.ANIMATION_DURATION);
        return this.refs._bottomEdit.bounceOutDown(this.ANIMATION_DURATION);
    }

    showSplit = () => {
        return this.refs._bottomSplit.bounceInUp(this.ANIMATION_DURATION);
    }

    hideSplit = () => {
        return this.refs._bottomSplit.bounceOutDown(this.ANIMATION_DURATION);
    }
    
    onPageSelected = ({position}) => {
        this.setState({
            passI: position
        });
    }

    renderPass = (pass) => {
        var expirationDT = moment(pass.expirationDT, "YYYY-MM-DD HH:mm:ss").format("MM/DD/YYYY");

        var screenWidth = Dimensions.get('window').width;

        return (<TouchableOpacity 
            style={{ 
                width: screenWidth - 20, 
                backgroundColor: "white", 
                margin: 10, 
                borderRadius: 10, 
                borderWidth: 2, 
                borderColor: 'grey' }}
            activeOpacity={(this.props.expanded)? 1.0: 0.2}
            onPress={(!this.props.expanded)? this.props.onPress: null}>
            <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                <Barcode value={pass.id} format="CODE128" />
            </View>
            <View style={{ width: screenWidth - 30 - 20, marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
                    <Text style={{textAlign: 'left', fontSize: this.FONT_SIZE * 0.7}}>
                        {pass.type}
                    </Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{textAlign: 'center', fontSize: this.FONT_SIZE}}>
                        {pass.name}
                    </Text>
                </View>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                    {
                        (expirationDT != null)? (
                        <Text style={{textAlign: 'right', fontSize: this.FONT_SIZE * 0.7}}>
                            {expirationDT}
                        </Text>): null
                    }
                </View>
            </View>
        </TouchableOpacity>);
    }

    renderButtons = () => {
        var screenWidth = Dimensions.get('window').width;

        return (
        <View style={{
            width: screenWidth,
            height: this.ICON_SIZE * 4
        }}>
            <Animatable.View ref="_bottom"
            animation="bounceIn"
            duration={this.ANIMATION_DURATION}
            style={{ 
                position: "absolute", 
                left: 0, 
                top: this.ICON_SIZE * 4, 
                width: screenWidth, 
                flexDirection: 'row', 
                justifyContent: 'space-evenly', 
                alignContent: 'center'
            }}>
                {
                    (this.props.splittingEnabled)? (
                    <Icon
                    raised
                    name="call-split"
                    size={this.ICON_SIZE}
                    color='blue'
                    onPress={this.onReqSplit} />): null
                }
                {
                    (this.props.editingEnabled)? (
                    <Icon
                    raised
                    name="edit"
                    size={this.ICON_SIZE}
                    color='blue'
                    onPress={this.onEdit} />): null
                }
                {
                    (this.props.splittingEnabled)? (
                    <Icon
                    raised
                    name="call-merge"
                    size={this.ICON_SIZE}
                    color='blue'
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND,
                        color: Theme.DISABLED_FOREGROUND
                    }}
                    disabled={this.props.splitters == null || this.props.splitters.length == 0}
                    onPress={this.onReqMerge} />): null
                }
            </Animatable.View>
        </View>);
    }

    renderEditButtons = (selectedPass) => {
        var screenWidth = Dimensions.get('window').width;

        return (
            <View style={{
                width: screenWidth,
                height: this.ICON_SIZE * 4
            }}>
                <Animatable.View ref="_visibilityPass"
                animation="bounceIn"
                duration={this.ANIMATION_DURATION}
                style={{
                    position: 'absolute',
                    left: 5,
                    top: this.ICON_SIZE / 2
                }}>
                    <Icon
                    raised
                    name={(selectedPass != null && selectedPass.isEnabled)? "visibility": "visibility-off"}
                    size={this.ICON_SIZE}
                    color='red'
                    onPress={(selectedPass != null && selectedPass.isEnabled)? this.onDisable: this.onEnable} />
                </Animatable.View>

                <Animatable.View ref="_removePass"
                animation="bounceIn"
                duration={this.ANIMATION_DURATION}
                style={{
                    position: 'absolute',
                    right: 5,
                    top: this.ICON_SIZE / 2
                }}>
                    <Icon
                    raised
                    name="delete"
                    disabled={!(this.props.removePass != null && (this.props.canRemove == null || this.props.canRemove(selectedPass)))}
                    size={this.ICON_SIZE}
                    color='red'
                    onPress={this.onReqRemovePass} />
                </Animatable.View>
                <Animatable.View ref="_bottomEdit"
                animation="bounceIn"
                duration={this.ANIMATION_DURATION}
                style={{ 
                    position: "absolute", 
                    left: 0, 
                    top: this.ICON_SIZE * 4, 
                    width: screenWidth, 
                    flexDirection: 'row', 
                    justifyContent: 'space-evenly', 
                    alignContent: 'center'
                }}>
                    <Icon
                    raised
                    name="close"
                    size={this.ICON_SIZE}
                    color="blue"
                    disabled={!this.state.hasEnabledPasses}
                    onPress={this.onHideEdit} />
                    <Icon
                    raised
                    name="add"
                    disabled={(this.props.onAdd != null && (this.props.canAdd == null || this.props.canAdd(selectedPass)))}
                    size={this.ICON_SIZE}
                    color='green'
                    onPress={this.onAdd} />
                </Animatable.View>
            </View>
        )
    }

    renderSplit = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        return (
        <View style={{
            width: screenWidth,
            height: this.ICON_SIZE * 4
        }}>
            <Animatable.View ref="_bottomSplit"
            animation="bounceIn"
            duration={this.ANIMATION_DURATION}
            style={{ 
                position: "absolute", 
                left: 0, 
                top: this.ICON_SIZE * 4, 
                width: screenWidth, 
                flexDirection: 'row', 
                justifyContent: 'space-evenly', 
                alignContent: 'center'
            }}>
                {
                    (this.props.splittingEnabled)? (
                    <Icon
                    raised
                    name="keyboard-backspace"
                    size={this.ICON_SIZE}
                    color='red'
                    onPress={this.onReqUnsplit} />): null
                }
                {
                    (this.props.editingEnabled)? (
                    <Icon
                    raised
                    name="edit"
                    size={this.ICON_SIZE}
                    color='blue'
                    onPress={this.onEdit} />): null
                }
                {
                    (this.props.splittingEnabled)? (
                    <Icon
                    raised
                    name="call-merge"
                    size={this.ICON_SIZE}
                    color='blue'
                    disabled={this.props.splitters == null || this.props.splitters.length == 0}
                    onPress={this.onReqMerge} />): null
                }
            </Animatable.View>
        </View>);
    }

    render() {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        
        var selectedPass = (this.state.passI >= 0 && this.state.passI < this.state.passes.length)? this.state.passes[this.state.passI]: null;
        var buttons = null;
        if (this.props.expanded) {
            if (this.state.editing) {
                buttons = this.renderEditButtons(selectedPass);
            } else {
                if (this.state.splitting) {
                    buttons = this.renderSplit(selectedPass);
                } else {
                    buttons = this.renderButtons(selectedPass);
                }
            }
        }

        if (this.props.error != null) {
            return (
                <View style={{
                    width: screenWidth,
                    height: screenHeight,
                    justifyContent: 'flex-start',
                    alignContent: 'center',
                    backgroundColor: '#333333'
                }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: this.FONT_SIZE * 2,
                        marginTop: 60,
                        color: Theme.PRIMARY_FOREGROUND,
                    }}>
                        {this.props.error}
                    </Text>
                </View>
            )
        }

        if (this.props.passes == null || this.props.passes.length == 0) {
            return <View style={{
                width: screenWidth,
                height: screenHeight,
                justifyContent: 'flex-start',
                alignContent: 'center',
                backgroundColor: '#333333'
            }}>
                {
                    (this.props.editingEnabled)? (
                    <View>
                        <Button
                        title='ADD PASS'
                        buttonStyle={{
                            textAlign: 'center',
                            fontSize: this.FONT_SIZE * 2,
                            marginTop: this.FONT_SIZE,
                            backgroundColor: 'blue'
                        }}
                        onPress={this.onAdd} />
                    </View>): 
                    (
                        <Text style={{
                            textAlign: 'center',
                            fontSize: this.FONT_SIZE * 2,
                            marginTop: this.FONT_SIZE,
                            color: Theme.PRIMARY_FOREGROUND
                        }}>
                            NO PASSES
                        </Text>
                    )
                }
            </View>
        }
        return (
            <View style={{
                flex: 1,
                backgroundColor: '#333333'
            }}>
                <IndicatorViewPager style={{
                    width: screenWidth,
                    height: screenHeight
                }}
                indicator={
                    (!this.state.editing)? (<PagerDotIndicator 
                        pageCount={this.state.passes.length} />): null
                }
                onPageSelected={this.onPageSelected}
                ref={(viewPager) => { this.viewPager = viewPager; }}>
                    {
                        this.state.passes.map((pass) => {    
                            return(
                            <View style={{ width: screenWidth, height: screenHeight }}>
                                { this.renderPass(pass) }
                            </View>);
                        })
                    }
                </IndicatorViewPager>
                {
                    (!this.props.expanded && this.props.editHint != null)? (
                        <Animatable.Text
                            animation="bounceInLeft"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 60, 
                                width: "100%",
                                fontSize: 26,
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                color: "white",
                                textAlign: "center"
                            }}>
                            {this.props.editHint}
                        </Animatable.Text>
                    ): null
                }
                {
                    (this.props.expanded)? (<Animatable.Image ref="_profile"
                    style={{
                        position: 'absolute',
                        left: (screenWidth / 2) - this.ICON_SIZE * 1.5,
                        top: this.PASS_HEIGHT + this.ICON_SIZE / 2.0,
                        width: this.ICON_SIZE * 3,
                        height: this.ICON_SIZE * 3,
                        borderRadius: this.ICON_SIZE,
                        borderWidth: 2,
                        borderColor: Theme.PRIMARY_FOREGROUND
                    }}
                    source={{uri: (selectedPass != null && selectedPass.user != null && selectedPass.user.profilePicUrl != null)? S3_URL + selectedPass.user.profilePicUrl + '-0.webp': null}} />): null
                }
                <View style={{
                    position: 'absolute',
                    left: 0,
                    top: this.PASS_HEIGHT,
                    width: screenWidth,
                    height: this.ICON_SIZE * 4
                }}>
                    { buttons }
                </View>
            </View>);
    }
};
