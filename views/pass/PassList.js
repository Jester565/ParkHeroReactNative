import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import AwsExports from '../../AwsExports';
import Amplify, { Storage } from 'aws-amplify';
import Theme from '../../Theme';
import { GetBlockLevel } from '../pass/PassLevel';

Amplify.configure(AwsExports);

var S3_URL = 'https://s3-us-west-2.amazonaws.com/disneyapp3/';

class PassRow extends React.PureComponent {
    onPress = () => {
        this.props.onPress(this.props.user);
    }

    onLongPress = () => {
        this.props.onLongPress(this.props.user);
    }

    render() {
        var fontSize = 14;
        return (<TouchableOpacity
            onPress={this.onPress}
            onLongPress={this.onLongPress}>
            <View
                elevation={10} 
                style={{
                    width: "100%", 
                    flex: 1, 
                    flexDirection:'row', 
                    justifyContent: 'flex-start',
                    alignContent: 'center',
                    backgroundColor: '#444444',
                    padding: 5,
                    borderRadius: 5,
                    borderWidth: 3,
                    borderColor: '#333333'
                }}>
                <CachedImage style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 30, 
                    marginRight: 5
                }} source={{uri: this.props.picUrl}} />
                { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignContent: 'center' }}>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text numberOfLines={1} style={{fontSize: fontSize * 1.2, fontWeight: 'bold', color: 'white' }}>
                                { this.props.userName }
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', alignContent: 'center' }}>
                        {
                            (this.props.passes.length > 1)? (
                                this.props.passes.map((pass) => {
                                    return (
                                    <View style={{ 
                                        width: "100%", 
                                        flexDirection: 'row', 
                                        alignContent: 'center',
                                        backgroundColor: (pass.isBlocked)? 'black': 'white'
                                    }}>
                                        <Text style={{
                                            width: "50%",
                                            textAlign: 'center', 
                                            justifyContent: 'center',
                                            fontSize: fontSize,
                                            color: (pass.isBlocked)? '#FF0000': 'black' }}>
                                            { pass.name }
                                        </Text>
                                        {
                                            (pass.type != null)? (
                                                <Text style={{
                                                    width: "50%",
                                                    textAlign: 'center', 
                                                    fontSize: fontSize,
                                                    color: (pass.isBlocked)? '#FF0000': 'black' }}>
                                                    { pass.type }
                                                </Text>
                                            ): null
                                        }
                                    </View>);
                                })
                            ): null
                        }
                    </View>
                </View>
            </View>
        </TouchableOpacity>);
    }
}

export default class PassList extends React.Component {
    constructor(props) {
        super();

        this.state = {
            userPassesArr: []
        };
    }

    componentWillMount() {
        this.updateBlackoutPasses(this.props);
    }

    componentWillReceiveProps(props) {
        this.updateBlackoutPasses(props);
    }

    updateBlackoutPasses = (props) => {
        if (props.userPasses == null || props.blockLevel == null) {
            return;
        }

        console.log("BLOCK LEVEL: ", props.blockLevel);

        var userPassesArr = [];
        for (var userPasses of props.userPasses) {
            var passes = [];
            var blockStr = "";
            for (var pass of userPasses.passes) {
                var passBlockLevel = GetBlockLevel(pass.type);
                console.log("BLOCKLEVEL: ", passBlockLevel);
                var isBlocked = (passBlockLevel <= props.blockLevel);
                var passWithBlock = Object.assign({}, pass);
                passWithBlock.isBlocked = isBlocked;
                blockStr += (isBlocked)? "1": "0";
                passes.push(passWithBlock);
            }
            if (passes.length > 0) {
                var key = userPasses.user.id + blockStr;
                userPassesArr.push({ key: key, user: userPasses.user, passes: passes });
            }
        }
        this.setState({
            userPassesArr: userPassesArr
        });
    }

    renderUserPasses = (userPasses) => {
        var user = userPasses.user;
        var passes = userPasses.passes;
        return (<PassRow 
            user={user}
            userID={user.id}
            userName={user.name}
            picUrl={S3_URL + user.profilePicUrl + '-0.webp'}
            passes={passes}
            onPress={this.props.onPress}
            onLongPress={this.props.onLongPress} />);
    }

    render() {
        return (
        <FlatList
            data={this.state.userPassesArr}
            renderItem={({item}) => this.renderUserPasses(item)} />);
    }
};
