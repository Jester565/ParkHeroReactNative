import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import Collapsible from 'react-native-collapsible';
import AwsExports from '../../AwsExports';
import Amplify, { Storage } from 'aws-amplify';
import { PagerDotIndicator, IndicatorViewPager } from 'rn-viewpager';
import Barcode from 'react-native-barcode-builder';
import Theme from '../../Theme';
import moment from 'moment';

Amplify.configure(AwsExports);

export default class PassPager extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            passes: props.passes.slice()
        }
    }
    render() {
                var screenWidth = Dimensions.get('window').width;
                var screenHeight = Dimensions.get('window').height;
                var iconSize = 26;
                var passHeight = 150;
                var fontSize = 14;
        return (
            <View style={{
                flex: 1
            }}>
                <Collapsible 
                    collapsed={false}
                    collapsedHeight={passHeight}>
                    <IndicatorViewPager style={{
                        width: screenWidth,
                        height: screenHeight
                    }}
                    indicator={
                        (!this.state.editing)? (<PagerDotIndicator 
                            
                            pageCount={this.state.passes.length} />): null
                    }
                    ref={(viewPager) => { this.viewPager = viewPager; }}>
                        {
                            (this.state.passes.map((pass) => {
                                console.log("RENDERING PASS: ", JSON.stringify(pass));
                                                                var expirationDT = moment(pass.expirationDT, "YYYY-MM-DD HH:mm:ss").format("MM/DD/YYYY");
                                return(
                                <View style={{ width: screenWidth, height: screenHeight }}>
                                    <View style={{ width: screenWidth - 20, backgroundColor: "white", margin: 10, borderRadius: 10, borderWidth: 2, borderColor: 'grey' }}>
                                        <View style={{ width: "100%", height: passHeight - fontSize, flexDirection: 'row', justifyContent: 'center', alignContent: 'center' }}>
                                            <Barcode style={{ height: passHeight - fontSize }} value={pass.id} format="CODE128" />
                                        </View>
                                        <View style={{ width: screenWidth - 30 - 20, marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
                                                <Text style={{textAlign: 'left', fontSize: fontSize * 0.7}}>
                                                    {pass.type}
                                                </Text>
                                            </View>
                                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                                    {pass.name}
                                                </Text>
                                            </View>
                                            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                                                {
                                                    (expirationDT != null)? (
                                                    <Text style={{textAlign: 'right', fontSize: fontSize * 0.7}}>
                                                        {expirationDT}
                                                    </Text>): null
                                                }
                                            </View>
                                        </View>
                                    </View>
                                </View>);
                            }))
                        }
                    </IndicatorViewPager>
                </Collapsible>
                <Icon
                    containerStyle={{
                        position: 'absolute',
                        left: 5,
                        top: passHeight + iconSize / 2
                    }}
                    raised
                    name="visibility"
                    size={iconSize}
                    color='red'
                />
                <Image
                    style={{
                        position: 'absolute',
                        left: (screenWidth / 2) - iconSize * 1.5,
                        top: passHeight,
                        width: iconSize * 3,
                        height: iconSize * 3,
                        borderRadius: iconSize,
                        borderWidth: 2,
                        borderColor: Theme.PRIMARY_FOREGROUND
                    }}
                    source={{uri: 'https://s3-us-west-2.amazonaws.com/disneyapp3/profileImgs/blank-profile-picture-973460_640.png'}} />
                <Icon
                    containerStyle={{
                        position: 'absolute',
                        right: 5,
                        top: passHeight + iconSize / 2
                    }}
                    raised
                    name="call-merge"
                    size={iconSize}
                    color='red'
                />
                
                <View style={{ 
                    position: "absolute", 
                    left: 0, 
                    top: passHeight + iconSize * 3, 
                    width: screenWidth, 
                    flexDirection: 'row', 
                    justifyContent: 'space-evenly', 
                    alignContent: 'center'
                }}>
                    {
                        (this.props.editingEnabled)? (<Icon
                            raised
                            name="edit"
                            size={iconSize}
                            color='blue' />): null
                    }
                    <Icon
                        raised
                        name="call-split"
                        size={iconSize}
                        color='blue' />
                </View>
            </View>);
    }
};
