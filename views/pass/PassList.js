import React from 'react';
import { Picker, StyleSheet, Image, TextInput, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Modal, TouchableWithoutFeedback } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card, SearchBar, Slider } from 'react-native-elements';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import AwsExports from '../../AwsExports';
import Amplify, { Storage } from 'aws-amplify';

Amplify.configure(AwsExports);

class PassRow extends React.PureComponent {
    render() {
        var fontSize = 14;
        return (<TouchableOpacity
            onPress={() => { this.props.onPress(this.props.userID) }}
            onLongPress={() => { this.props.onLongPress(this.props.userID) }}>
            <View
                elevation={10} 
                style={{
                    width: "100%", 
                    flex: 1, 
                    flexDirection:'row', 
                    justifyContent: 'flex-start',
                    backgroundColor: '#444444',
                    padding: 5,
                    borderRadius: 5,
                    borderWidth: 3,
                    borderColor: '#333333'
                }}>
                <CachedImage style={{ width: 60, height: 60, borderRadius: 30 }} source={{uri: this.props.picUrl}} />
                { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                { this.props.userName }
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', alignContent: 'center' }}>
                        {
                            (this.props.passes.length > 1)? (
                                this.props.passes.map((pass) => {
                                    return (<Text style={{textAlign: 'center', fontSize: fontSize }}>
                                        { pass.name }
                                    </Text>);
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
        this.signPromises = {};

        this.state = {
            signedUrls: {}
        };
    }

    getSignedUrl = (url) => {
        var getPromise = Storage.get(url, { 
            level: 'public',
            customPrefix: {
                public: ''
        }});
        this.signPromises[url] = getPromise;
        getPromise.then((signedUrl) => {
            var signedUrls = Object.assign({}, this.state.signedUrls);
            signedUrls[url] = signedUrl;
            this.setState({
                signedUrls: signedUrls
            });
        });
    }

    renderUserPasses = (userPasses) => {
        var user = userPasses.user;
        var passes = userPasses.passes;
        var picUrl = "profileImgs/blank-profile-picture-973460_640.png";
        if (user.picUrl != null) {
            picUrl = user.picUrl;
        }
        var signedPicUrl = null;
        signedPicUrl = this.state.signedUrls[picUrl];
        if (signedPicUrl == null && this.signPromises[picUrl] == null) {
            this.getSignedUrl(signedPicUrl);
        }
        return (<PassRow 
            userID={user.id}
            userName={user.name}
            picUrl={signedPicUrl}
            passes={passes} />)
    }

    render() {
        return (
        <FlatList
            data={this.props.userPasses}
            renderItem={({item}) => this.renderUserPasses(item)} />)
    }
};
