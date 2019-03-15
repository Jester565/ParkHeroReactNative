import React from 'react';
import { View, Dimensions, Image, TouchableOpacity, TouchableHighlight, Text, Modal } from 'react-native';
import { Icon, Button, FormInput } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import * as Animatable from 'react-native-animatable';
import Theme from '../../Theme';
import AwsExports from '../../AwsExports';
import PassParallax from '../pass/PassParallax';
import * as queries from '../../src/graphql/queries';
import * as mutations from '../../src/graphql/mutations';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Switch } from 'react-native-gesture-handler';
import ImagePicker from 'react-native-image-crop-picker';

Amplify.configure(AwsExports);

var S3_URL = "https://s3-us-west-2.amazonaws.com/disneyapp3/";

export default class Profile extends React.Component {
    static navigationOptions = {
        title: 'Profile',
        header: null
    };

    constructor(props) {
        super();
        this.ANIMATION_DURATION = 500;

        const { navigation } = props;
                var user = navigation.getParam('user');
                var authenticated = navigation.getParam('authenticated');
        this.state = {
            user: user,
            authenticated: authenticated,
            passes: null,
            editing: false,
            passesExpanded: false,
            imagePickerOpen: false,
            username: null,
            imgUri: null
        };
    }

    componentWillMount() {
        this.refreshPasses();
    }

    onEdit = () => {
        this.hideNonEdit().then(() => {
            this.setState({
                editing: true,
                username: this.state.user.name
            }, () => {
                this.showEdit();
            })
        })
    }

    onCancelEdit = () => {
        this.hideEdit().then(() => {
            this.setState({
                editing: false,
                username: null,
                imgUri: null
            }, () => {
                this.showNonEdit();
            });
        });
    }

    onPassExpand = () => {
        if (this.state.editing) {
            this.hideEdit().then(() => {
                this.setState({
                    passesExpanded: true
                });
            });
        } else {
            this.hideNonEdit().then(() => {
                this.setState({
                    passesExpanded: true
                });
            });
        }
    }

    onPassContract = () => {
        this.setState({
            passesExpanded: false
        }, () => {
            if (this.state.editing) {
                this.showEdit();
            } else {
                this.showNonEdit();
            }
        });
    }

    onEditImage = () => {
        this.setState({
            imagePickerOpen: true
        });
    }

    onCameraPick = () => {
        ImagePicker.openCamera({
            width: 300,
            height: 400,
            cropping: true,
        }).then(image => {
            this.onImage(image);
        }).catch(() => {});
    }

    onGalleryPick = () => {
        ImagePicker.openPicker({
            width: 400,
            height: 400,
            cropping: true,
            includeBase64: true
        }).then(image => {
            this.onImage(image);
        }).catch(() => {});
    }

    onImage = (image) => {
        this.setState({
            imagePickerOpen: false,
            imgUri: `data:${image.mime};base64,${image.data}`
        });
    }

    closeImagePicker = () => {
        this.setState({
            imagePickerOpen: false
        });
    }

    refreshPasses = () => {
        API.graphql(graphqlOperation(queries.getUserPasses)).then((data) => {
            var allUserPasses = data.data.getUserPasses;
            var newPasses = [];
            for (var userPasses of allUserPasses) {
                for (var pass of userPasses.passes) {
                    pass.user = userPasses.user;
                    newPasses.push(pass);
                }
            }
            this.setState({
                passes: newPasses
            });
        });
    }

    addPass = (passID) => {
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(mutations.updatePass, { 
                passID: passID,
                isEnabled: true
            })).then((data) => {
                var userPass = data.data.updatePass;
                var newPasses = [];
                if (this.state.passes != null) {
                    newPasses = this.state.passes.slice();
                }
                var pass = userPass.pass;
                pass.user = userPass.user;
                newPasses.push(pass);
                this.setState({
                    passes: newPasses
                });
                resolve(userPass);
            }).catch((err) => {
                console.warn("ADD PASS ERROR: ", err);
                reject(err);
            });
        });
    }

    removePass = (passID) => {
        return new Promise((resolve, reject) => {
            API.graphql(graphqlOperation(mutations.removePass, { 
                passID: passID
            })).then(() => {
                var newPasses = [];
                if (this.state.passes != null) {
                    for (var pass of this.state.passes) {
                        if (pass.id != passID) {
                            newPasses.push(pass);
                        }
                    }
                }
                this.setState({
                    passes: newPasses
                });
                resolve();
            }).catch((err) => {
                console.warn("REMOVE PASS ERROR: ", err);
                reject(err);
            });
        });
    }

    showEdit = () => {
        this.refs._editFooter.bounceInUp(this.ANIMATION_DURATION);
        this.refs._nameEdit.bounceInLeft(this.ANIMATION_DURATION);
        this.refs._visibleSwitch.bounceInRight(this.ANIMATION_DURATION);
        return this.refs._soundSwitch.bounceInRight(this.ANIMATION_DURATION);
    }

    hideEdit = () => {
        this.refs._editFooter.bounceOutDown(this.ANIMATION_DURATION);
        this.refs._nameEdit.bounceOutLeft(this.ANIMATION_DURATION);
        this.refs._visibleSwitch.bounceOutRight(this.ANIMATION_DURATION);
        return this.refs._soundSwitch.bounceOutRight(this.ANIMATION_DURATION);
    }

    showNonEdit = () => {
        this.refs._nonEditFooter.bounceInUp(this.ANIMATION_DURATION);
        return this.refs._nameText.bounceInRight(this.ANIMATION_DURATION);
    }

    hideNonEdit = () => {
        this.refs._nonEditFooter.bounceOutDown(this.ANIMATION_DURATION);
        return this.refs._nameText.bounceOutRight(this.ANIMATION_DURATION);
    }

    onSubmit = () => {
        console.log("ON SUBMIT");
    }

    renderHeaderForeground = () => {
        return (
            <TouchableHighlight 
            style={{flex: 1}}
            onPress={(this.state.editing)? this.onEditImage: null}
            activeOpacity={(this.state.editing)? 0.2: 0}
            underlayColor={'rgba(255, 255, 255, 0.2)'}>
                <View style={{flex: 1}} />
            </TouchableHighlight>
        );
    }

    renderHeaderBackground = () => {
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;

        return (
        <View 
        style={{flex: 1}}
        activeOpacity={(this.props.editing)? 1.0: 0.2}
        onPress={(this.state.editing)? this.onEditImage: null}>
            <CachedImage
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3,
                justifyContent: 'center',
                alignItems: 'center' }} 
            resizeMode={'cover'} 
            blurRadius={1}
            source={{uri: (this.state.imgUri)? this.state.imgUri: S3_URL + this.state.user.profilePicUrl}} />
            <CachedImage 
            style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: screenWidth, 
                height: screenHeight * 0.3 }} 
            resizeMode={'contain'}
            source={{uri: (this.state.imgUri)? this.state.imgUri: S3_URL + this.state.user.profilePicUrl}} />
            {
                (this.state.editing)?
                (
                    <Animatable.Text 
                    animation="bounceInRight"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        width: "100%",
                        top: 130,
                        left: 0,
                        fontSize: 30,
                        color: 'black',
                        textAlign: 'center'
                    }}>
                        Press To Change
                    </Animatable.Text>
                ): null
            }
        </View>);
    }

    renderEditFooter = () => {
        var submitDisabled = this.state.submitting;
        return (<Animatable.View 
            ref="_editFooter"
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
                    disabled={this.state.submitting}
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
            </Animatable.View>);
    }

    renderNonEditFooter = () => {
        return (<Animatable.View 
            ref="_nonEditFooter"
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
                    title='EDIT' 
                    rounded={true} 
                    backgroundColor={'blue'} 
                    containerViewStyle={{ flex: 1 }}
                    onPress={this.onEdit}
                    disabledStyle={{
                        backgroundColor: Theme.DISABLED_BACKGROUND
                    }}
                    disabledTextStyle={{
                        color: Theme.DISABLED_FOREGROUND
                    }} />
            </Animatable.View>);
    }

    render() {
        var footer = null;
        if (!this.state.passesExpanded) {
            footer = (this.state.editing)? this.renderEditFooter(): this.renderNonEditFooter();
        }
        var fontSize = 35;
        var subFontSize = 26;
        const { navigation } = this.props;
        var isMe = navigation.getParam('isMe');
        var screenWidth = Dimensions.get('window').width;
        var screenHeight = Dimensions.get('window').height;
        
        return (<View style={{
            width: "100%",
            height: "100%"
        }}>
            <PassParallax
            headerHeight={screenHeight * 0.3}
            renderHeaderForeground={this.renderHeaderForeground}
            renderHeaderBackground={this.renderHeaderBackground}
            editingEnabled={true}
            passes={this.state.passes}
            navigation={this.props.navigation}
            currentUserID={(this.props.isMe)? this.state.user.id: null}
            addPass={this.addPass}
            removePass={this.removePass}
            onExpand={this.onPassExpand}
            onContract={this.onPassContract}
            editHint={(this.state.editing)? "Press to Edit": null}>
                <View style={{
                    width: "100%",
                    flexDirection: 'column',
                    alignContent: 'center',
                    marginTop: 20
                }}>
                    {
                        (!this.state.editing)? (
                            <Animatable.Text style={{
                                fontSize: fontSize,
                                color: Theme.PRIMARY_FOREGROUND,
                                textAlign: 'center'
                            }}
                            ref="_nameText" >
                                {this.state.user.name}
                            </Animatable.Text>):
                        (
                            <Animatable.View
                            ref="_nameEdit">
                                <FormInput 
                                inputStyle={{ color: Theme.PRIMARY_FOREGROUND }}
                                placeholderTextColor={ Theme.DISABLED_FOREGROUND }
                                placeholder={"Name"} 
                                value={this.state.username}
                                underlineColorAndroid={Theme.PRIMARY_FOREGROUND} 
                                blurOnSubmit={true} 
                                onChangeText={(value) => {this.setState({ "username": value })}} />
                            </Animatable.View>
                        )
                    }
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignContent: 'center',
                        marginTop: 20,
                        padding: 5,
                        borderTopWidth: 2,
                        borderColor: '#111111',
                        backgroundColor: Theme.PRIMARY_BACKGROUND
                    }}>
                        <Text style={{
                            color: Theme.PRIMARY_FOREGROUND,
                            fontSize: subFontSize
                        }}>
                            Profile is <Text style={{color: '#00FF7F'}}>Visible</Text>
                        </Text>
                        {
                            (this.state.editing)? (<Animatable.View
                                ref="_visibleSwitch"
                                style={{
                                    justifyContent: 'center',
                                    alignContent: 'center'
                                }}>
                                    <Switch
                                        disabled={!this.state.editing}
                                        value={true} />
                                </Animatable.View>): null
                        }
                    </View>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignContent: 'center',
                        padding: 5,
                        borderTopWidth: 3,
                        borderBottomWidth: 2,
                        borderColor: '#111111',
                        backgroundColor: Theme.PRIMARY_BACKGROUND
                    }}>
                        <Text style={{
                            color: Theme.PRIMARY_FOREGROUND,
                            fontSize: subFontSize
                        }}>
                            Notifictions <Text style={{color: '#00FF7F'}}>Make Sound</Text>
                        </Text>
                        {
                            (this.state.editing)? (
                                <Animatable.View
                                ref="_soundSwitch" 
                                style={{
                                    justifyContent: 'center',
                                    alignContent: 'center'
                                }}>
                                    <Switch
                                        disabled={!this.state.editing}
                                        value={true} />
                                </Animatable.View>
                            ): null
                        }
                    </View>
                </View>
            </PassParallax>
            {footer}
            <Modal
            animationType="slide"
            visible={this.state.imagePickerOpen}
            onRequestClose={this.closeImagePicker}
            transparent={true}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    justifyContent: 'center',
                    alignContent: 'center'
                }}>
                    <View style={{
                        padding: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 2,
                        borderColor: 'black',
                        borderRadius: 5
                    }}>
                        <Button
                            title='CAMERA' 
                            icon={{name: 'camera-alt'}}
                            rounded={true} 
                            backgroundColor={'lime'} 
                            containerViewStyle={{ marginTop: 20 }}
                            onPress={this.onCameraPick}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                        <Button
                            title='GALLERY' 
                            icon={{name: 'photo-library'}}
                            rounded={true} 
                            backgroundColor={'blue'} 
                            containerViewStyle={{ marginTop: 20 }}
                            onPress={this.onGalleryPick}
                            disabledStyle={{
                                backgroundColor: Theme.DISABLED_BACKGROUND
                            }}
                            disabledTextStyle={{
                                color: Theme.DISABLED_FOREGROUND
                            }} />
                    </View>
                </View>
            </Modal>
        </View>);
    }
};
