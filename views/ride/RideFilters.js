import React from 'react';
import { StyleSheet, Image, TextInput, View, FlatList } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text, Avatar, Card } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import * as Animatable from 'react-native-animatable';
import Fade from '../utils/Fade';
import Toast from 'react-native-root-toast';
import AwsExports from '../../AwsExports';
import Amplify, { Auth } from 'aws-amplify';

Amplify.configure(AwsExports);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    card: {
        width: "100%", 
        flex: 1, 
        flexDirection:'row', 
        justifyContent: 'flex-start',
        backgroundColor: '#449944',
        padding: 5,
        borderRadius: 5,
        borderWidth: 3,
        borderColor: '#333333'
    }
});

export default class RideFilters extends React.Component {
    static navigationOptions = {
        title: 'RideList',
        header: null
    };

    constructor(props) {
        super();
        
    }

    renderRide = (item) => {
        var fontSize = 18;
        return (
            <View elevation={10} style={styles.card}>
                <Avatar
                    height={60}
                    rounded
                    source={{uri: item.img}} />
                { /* alignContent applies to secondary access (in this case horizontal and we want it centered */ }
                <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                {item.name}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{textAlign: 'center', fontSize: fontSize }}>
                                {item.waitMins}
                            </Text>
                        </View>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                {item.fastPassTime}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    render() {
        return (
            <View style={{backgroundColor: "#404040", height: 300}}>
                <FlatList
                    data={[{key: '102002', name: 'Thunder Mountain', img: "https://s3.amazonaws.com/uifaces/faces/twitter/kfriedson/128.jpg", waitMins: 20, fastPassTime: '6:30 PM' }]}
                    renderItem={({item}) => this.renderRide(item)} />
            </View>)
    }
};
