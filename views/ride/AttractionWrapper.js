import React from 'react';
import { ScrollView, View, TouchableOpacity, Text, Image } from 'react-native';
import { FormInput, Button, Icon } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import { Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import moment from 'moment';
import { PagerDotIndicator, IndicatorViewPager } from 'rn-viewpager';
import DraggableFlatList from 'react-native-draggable-flatlist'
import AwsExports from '../../AwsExports';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import ImagePicker from 'react-native-image-picker';
import Collapsible from 'react-native-collapsible';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import WaitTimeChart from './WaitTimeChart';
import FastPassChart from './FastPassChart';
import Matterhorn from '../customride/Matterhorn';
import NetManager from '../../NetManager';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

var CUSTOM_ATTRACTION_VIEW_URLS = {
    "353377": "matterhorn_custom_view"
};

var CUSTOM_ATTRACTION_URL_RENDERS = {
    "matterhorn_custom_view": () => {
        return <Matterhorn width={310} />;
    }
}

export default class AttractionWrapper extends React.Component {
    constructor(props) {
        super(props);

        this.signedUrls = {};
        this.signPromises = {};

        var attraction = props.attraction;

        var pics = this.getPics(attraction);

        this.state = {
            editing: false,
            submitting: false,
            attraction: attraction,
            pics: pics,
            officialPics: pics,
            selectedPicI: 0,
            showEditing: false
        }
    }

    getPics = (attraction) => {
        var picUrls = (attraction.customPicUrls != null)? attraction.customPicUrls: [attraction.picUrl];
        var pics = [];
        var containsCustomPic = false;
        for (var picUrl of picUrls) {
            if (picUrl == CUSTOM_ATTRACTION_VIEW_URLS[attraction.id]) {
                containsCustomPic = true;
                break;
            }
        }
        //If Matterhorn
        if (!containsCustomPic && CUSTOM_ATTRACTION_VIEW_URLS[attraction.id] != null) {
            picUrls.unshift(CUSTOM_ATTRACTION_VIEW_URLS[attraction.id]);
        }

        picUrls.forEach((picUrl, i) => {
            var pic = null;
            if (CUSTOM_ATTRACTION_VIEW_URLS[attraction.id] == picUrl) {
                pic = {
                    key: picUrl,
                    public: true,
                    url: picUrl,
                    selected: (i == 0),
                    customView: true
                }
            } else {
                pic = {
                    key: picUrl,
                    public: (picUrl == attraction.officialPicUrl),
                    url: picUrl,
                    urls: [],
                    keys: [],
                    signedUrls: [],
                    selected: (i == 0),
                    local: false,
                }
                for (var i = 0; i < 4; i++) {
                    var key = pic.url + '-' + i.toString() + '.webp';
                    pic.urls.push(S3_URL + key);
                    pic.keys.push(key);
                    pic.signedUrls.push(this.signedUrls[key]);
                }
            }
            pics.push(pic);
        });

        return pics;
    }

    getSignedUrl = (sizeI, iPic) => {
        if (iPic.local) {
            return iPic.url;
        }
        if (iPic.public) {
            return iPic.urls[sizeI];
        }
        var key = iPic.keys[sizeI];
        if (this.signPromises[key] != null) {
            return iPic.signedUrls[sizeI];
        }
        var getPromise = Storage.get(key, { 
            level: 'public',
            customPrefix: {
                public: ''
        }});
        this.signPromises[key] = getPromise;
        getPromise.then((signedUrl) => {
            this.signedUrls[key] = signedUrl;
            var picI = null;
            this.state.pics.forEach((pic, i) => {
                if (pic.url == iPic.url) {
                    picI = i;
                }
            });
            if (picI != null) {
                var pics = this.state.pics.slice();
                pics[picI] = Object.assign({}, pics[picI]);
                pics[picI].signedUrls[sizeI] = signedUrl;
                console.log("DONE: ", JSON.stringify(pics));
                this.setState({
                    pics: pics
                });
            }
        });
    }

    onEdit = () => {
        var attraction = this.getAttraction();

        this.setState({
            editing: true,
            name: attraction.name,
            showEditing: true
        }, () => {
            var transitionLength = 450;
            this.refs._editIcon.bounceOutRight(transitionLength);
            this.refs._editFooter.bounceInUp(transitionLength);
            this.refs._deleteImageIcon.bounceInLeft(transitionLength);
            this.refs._addImageIcon.bounceInRight(transitionLength);
        })
    }

    onCancelEdit = () => {
        var transitionLength = 450;
        this.refs._editIcon.bounceInRight(transitionLength);
        this.refs._editFooter.bounceOutDown(transitionLength);
        this.refs._deleteImageIcon.bounceOutLeft(transitionLength);
        this.refs._addImageIcon.bounceOutRight(transitionLength).then(endState => {
            if (endState.finished) {
                this.setState({
                    showEditing: false
                })
            }
        });

        this.setState({
            editing: false,
            submitting: false,
            pics: this.state.officialPics,
            selectedPicI: 0
        });
    }

    onSubmit = () => {
        var attraction = this.getAttraction();
        this.setState({
            submitting: true
        }, () => {
            var customName = this.state.name;
            var picPayload = [];
            this.state.pics.forEach((pic, i) => {
                if (i != 0 || pic.url != CUSTOM_ATTRACTION_VIEW_URLS[attraction.id]) {
                    picPayload.push({
                        url: pic.url,
                        added: pic.local
                    });
                }
            });
            API.graphql(graphqlOperation(mutations.updateCustomAttractionInfo, { 
                attractionID: attraction.id, 
                customName: customName, 
                pics: picPayload })).then((data) => {
                    var attractionInfo = data.data.updateCustomAttractionInfo;
                    console.log("PICS: ", JSON.stringify(this.state.pics));
                    var newAttraction = Object.assign({}, this.state.attraction);
                    newAttraction = Object.assign(newAttraction, attractionInfo);
                    var pics = this.getPics(newAttraction);
                    console.log("NEW PICS: ", JSON.stringify(pics));
                    this.setState({
                        attraction: newAttraction,
                        pics: pics,
                        officialPics: pics
                    }, () => {
                        this.onCancelEdit();
                    });

                    this.props.onAttractionUpdate(newAttraction);
            });   
        });
    }

    onDeletePic = () => {
        var pics = this.state.pics.slice();
        pics.splice(this.state.selectedPicI, 1);
        this.setState({
            pics: pics
        }, () => {
            var nextIdx = (this.state.selectedPicI >= this.state.pics.length)? this.state.selectedPicI - 1: this.state.selectedPicI;
            this.viewPager.setPage(nextIdx);
        });
    }

    onAddPic = () => {
        var pickerOptions = {
            title: 'Select Picture',
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 0.75,
            storageOptions: {
                skipBackup: false,
                path: 'images'
            }
        };
        ImagePicker.showImagePicker(pickerOptions, (response) => {
            if (response.didCancel) {
                console.log("Image cancelled");
            }
            else if (response.error) {
                console.warn('ImagePicker Error: ', response.error);
            } else {
                var uri = "data:" + response.type + ";base64," + response.data;
                var pics = this.state.pics.slice();
                var pic = {
                    key: uri,
                    url: uri,
                    urls: [],
                    selected: true,
                    public: false,
                    local: true
                }
                for (var i = 0; i < 4; i++) {
                    pic.urls.push(uri);
                }
                pics.splice(this.state.selectedPicI + 1, 0, pic);
            
                this.setState({
                    pics: pics
                }, () => {
                    this.viewPager.setPage(this.state.selectedPicI + 1);
                });
            }
        });
    }

    getAttraction = () => {
        return this.state.attraction;
    }

    onSmallPicPressed = (index) => {
        this.viewPager.setPage(index);
    }

    onPageSelected = ({position}) => {
        var pics = this.state.pics.slice();
        if (this.state.selectedPicI < this.state.pics.length) {
            pics[this.state.selectedPicI] = Object.assign({}, pics[this.state.selectedPicI]);
            pics[this.state.selectedPicI].selected = false;
        }
        pics[position] = Object.assign({}, pics[position]);
        pics[position].selected = true;
        this.setState({
            selectedPicI: position,
            pics: pics
        });
    }

    onMoveEnd = ({ data }) => { 
        var selectedPicI = 0;
        data.forEach((pic, i) => {
            if (pic.selected) {
                selectedPicI = i;
            }
        });
        this.setState({ 
            pics: data, 
            selectedPicI: selectedPicI 
        }, () => {
            this.viewPager.setPage(selectedPicI);
        });
    }
    
    renderSmallPic = ({ item, index, move, moveEnd, isActive }) => {
        var pic = item;
        var smallPicUrl = (!pic.customView)? this.getSignedUrl(1, pic): null;
        var backgroundColor = Theme.PRIMARY_BACKGROUND;
        if (isActive) {
            backgroundColor = 'blue';
        } else if (pic.selected) {
            backgroundColor = '#DDDDDD';
        }
        return (
        <TouchableOpacity
        key={pic.url}
        style={{ 
            width: 110,
            height: 100, 
            backgroundColor: backgroundColor,
            alignItems: 'center', 
            justifyContent: 'center' 
        }}
        onPress={() => {this.onSmallPicPressed(index)}}
        onLongPress={move}
        onPressOut={moveEnd}
        onMoveEnd={({ data }) => this.setState({ data })}>
            {
                (!pic.customView)? (
                    <CachedImage
                    style={{ 
                        width: 100,
                        height: 100 }}
                    resizeMode={'cover'} 
                    source={{uri: smallPicUrl}} />
                ): <Image
                    style={{ 
                        width: 100,
                        height: 100 
                    }}
                    source={require('../../assets/ride.png')}
                    resizeMode={'contain'} 
                    />
            }
            
        </TouchableOpacity>);
    }

    renderHeader = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        return (<View style={{
            width: screenWidth, 
            height: screenHeight * 0.6,
            paddingBottom: 20,
            backgroundColor: Theme.PRIMARY_BACKGROUND
        }}>
            <IndicatorViewPager style={{
                width: screenWidth, 
                height: screenHeight * 0.6
            }}
            indicator={
                (!this.state.editing)? (<PagerDotIndicator pageCount={this.state.pics.length} />): null
            }
            ref={(viewPager) => { this.viewPager = viewPager; }}
            onPageSelected={this.onPageSelected}>
                {
                    (this.state.pics.map((pic) => {
                        if (pic.customView) {
                            var view = CUSTOM_ATTRACTION_URL_RENDERS[pic.url]();
                            return (<View>
                                {view}
                            </View>);
                        }
                        var miniPicUrl = this.getSignedUrl(0, pic);
                        var largePicUrl = this.getSignedUrl(3, pic);

                        return (<View 
                            style={{
                                width: screenWidth, 
                                height: screenHeight * 0.6
                            }}>
                            <CachedImage
                            style={{ 
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: screenWidth, 
                                height: screenHeight * 0.6,
                                justifyContent: 'center',
                                alignItems: 'center' }} resizeMode={'cover'} blurRadius={(pic.local)? 10: 1} source={{uri: miniPicUrl}}/>
                            <CachedImage 
                            style={{ 
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: screenWidth, 
                                height: screenHeight * 0.6 }} resizeMode={'contain'} source={{uri: largePicUrl}}/>
                        </View>)
                    }))
                }
            </IndicatorViewPager>
        </View>);
    }

    renderEditHeader = () => {
        var fontSize = 30;
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        
        return (
            <Collapsible collapsed={!this.state.editing}>
                <View style={{
                width: "100%", 
                height: 105,
                flexDirection: 'row', 
                justifyContent: 'space-evenly', 
                alignContent: 'center',
                backgroundColor: Theme.PRIMARY_BACKGROUND }}>
                    <DraggableFlatList
                        contentContainerStyle={{
                            flex: (this.state.pics.length * 110 < screenWidth)? 1: 0, 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: 105
                        }}
                        data={this.state.pics}
                        renderItem={this.renderSmallPic}
                        horizontal={true}
                        onMoveEnd={this.onMoveEnd} />
                </View>
                <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center', marginBottom: 15 }}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <FormInput 
                            inputStyle={{ color: Theme.PRIMARY_FOREGROUND, fontSize: fontSize * 0.9 }}
                            placeholderTextColor={ Theme.DISABLED_FOREGROUND }
                            placeholder={"Name"} 
                            pointerEvents={"none"}
                            value={this.state.name}
                            returnKeyType = {"done"} 
                            underlineColorAndroid={Theme.PRIMARY_FOREGROUND}
                            onChangeText={(value) => {this.setState({ name: value })}}
                            onSubmitEditing={this.onNameSubmit}
                            onFocus={() => {
                                this.refs._scrollView.scrollTo({ y: screenHeight * 0.4, animated: true });
                            }} />
                    </View>
                </View>
            </Collapsible>);
    }

    render() {
        var selectedPic = null;
        if (this.state.selectedPicI < this.state.pics.length) {
            selectedPic = this.state.pics[this.state.selectedPicI];
        }

        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        var deleteDisabled = (selectedPic == null || selectedPic.public);
        var addDisabled = (selectedPic == null);

        var attraction = this.getAttraction();
        var submitDisabled = !(this.state.name != null && this.state.name.length > 0);
        if (!submitDisabled) {
            var nameChanged = (this.state.name != attraction.name);
            if (!nameChanged) {
                var picsChanged = (this.state.pics.length != this.state.officialPics.length);
                if (!picsChanged) {
                    this.state.pics.forEach((pic, i) => {
                        var officialPic = this.state.officialPics[i];
                        if (pic.url != officialPic.url) {
                            picsChanged = true;
                        }
                    });
                }
            }
            submitDisabled = (!nameChanged && !picsChanged);
        }

        var fontSize = 30;

        var shouldRenderWaitTimes = (this.state.dps != null);
        var shouldRenderFastPasses = (this.state.dps != null && this.state.attraction.labels.indexOf("FASTPASS") >= 0);
        return (<View>
            <ScrollView ref="_scrollView">
                <View>
                    {this.renderHeader(attraction)}
                    {this.renderEditHeader()}
                    {
                        (this.state.showEditing)? (
                            <Animatable.View 
                            ref="_deleteImageIcon" 
                            animation="bounceOutLeft"
                            style={{
                                position: 'absolute',
                                left: 3,
                                top: screenHeight * 0.54
                            }}>
                                <Icon
                                    raised
                                    name='delete'
                                    disabled={deleteDisabled}
                                    color={(!deleteDisabled)? Theme.PRIMARY_FOREGROUND: Theme.DISABLED_FOREGROUND}
                                    containerStyle={{ 
                                        backgroundColor: (!deleteDisabled)? 'red': Theme.DISABLED_BACKGROUND }}
                                    onPress={ this.onDeletePic } />
                            </Animatable.View>
                        ): null
                    }
                    {
                        this.state.showEditing? (
                            <Animatable.View 
                            ref="_addImageIcon" 
                            animation="bounceOutRight"
                            style={{
                                position: 'absolute',
                                right: 3,
                                top: screenHeight * 0.54
                            }}>
                                <Icon
                                    raised
                                    name='add'
                                    disabled={ addDisabled }
                                    color={Theme.PRIMARY_FOREGROUND}
                                    containerStyle={{ 
                                        backgroundColor: 'green' }}
                                    onPress={ this.onAddPic } />
                            </Animatable.View>
                        ): null
                    }
                </View>
                <Collapsible collapsed={this.state.editing}>
                    <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center', marginBottom: 15 }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold', color: Theme.PRIMARY_FOREGROUND }}>
                                {attraction.name}
                            </Text>
                        </View>
                    </View>
                </Collapsible>
                {
                    this.props.children
                }
                <View style={{height: 75}} />
            </ScrollView>
            <Animatable.View 
            ref="_editIcon"
            animation="bounceInRight"
            style={{
                position: 'absolute',
                right: 10,
                bottom: 10
            }}>
                <Icon
                raised
                name='edit'
                color={Theme.PRIMARY_FOREGROUND}
                containerStyle={{ 
                    backgroundColor: 'blue' }}
                onPress={ this.onEdit } />
            </Animatable.View>
            {
                this.state.showEditing? (
                    <Animatable.View 
                    ref="_editFooter"
                    animation="bounceOutDown"
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: -30,
                        width: "100%",
                        flexDirection: 'row', 
                        justifyContent: 'space-evenly',
                        paddingTop: 10,
                        backgroundColor: Theme.PRIMARY_BACKGROUND,
                        borderTopWidth: 3,
                        borderColor: "#222222",
                        paddingBottom: 40
                    }}>
                        <Button
                            title='CANCEL' 
                            disabled={this.state.saving}
                            rounded={true} 
                            backgroundColor={'red'} 
                            containerViewStyle={{ flex: 1 }}
                            onPress={this.onCancelEdit}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                        <Button
                            title='SUBMIT' 
                            loading={this.state.submitting} 
                            disabled={this.state.submitting || submitDisabled}
                            rounded={true} 
                            backgroundColor={'lime'} 
                            containerViewStyle={{ flex: 1 }}
                            onPress={this.onSubmit}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                    </Animatable.View>
                ): null
            }
        </View>);
    }
};
