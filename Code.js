import React from 'react';
import { StyleSheet, Image, TextInput } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage, Button, ThemeProvider, Icon, Text } from 'react-native-elements';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import { createAnimatableComponent, View } from 'react-native-animatable';
import Fade from './utils/Fade';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    }
});

const theme = {
    Button: {
      titleStyle: {
        color: 'red',
      },
    },
  };

export default class Code extends React.Component {
    static navigationOptions = {
        title: 'Code',
        header: null
    };

    constructor(props) {
        super();
        this.state = {
            code: '',
            submitting: false
        };
    }

    render() {
        const { classes } = this.props;
        return (
                <View>
                    <View animation="bounceIn" iterationCount={1} duration={1500} style={{ justifyContent:'center', alignItems: 'center', width: "100%", height: 110 }} useNativeDriver>
                        <Icon
                            name='email'
                            size={100}
                            color='#000000' />
                    </View>
                    <View animation="bounceInLeft" iterationCount={1} duration={1500} style={{ width: "100%", height: 100, flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30}} useNativeDriver>
                        <Text h4>Check Your Email</Text>
                    </View>
                    <View>
                        <Fade visible={this.state.code.length > 0} duration={100}>
                            <FormLabel>Code</FormLabel>
                        </Fade>
                    </View>
                    <View animation="bounceInRight" iterationCount={1} duration={1500} useNativeDriver>
                        <FormInput 
                            placeholder={"Code"} 
                            value={this.state.code}
                            underlineColorAndroid="#000000" 
                            onChangeText={(value) => {this.setState({ "code": value })}} />
                    </View>
                    <View animation="bounceInUp" iterationCount={1} duration={1500} useNativeDriver>
                        <Button
                            title='Submit' 
                            loading={this.state.submitting} 
                            disabled={!(this.state.code.length > 0) || this.state.submitting}
                            rounded={true} 
                            backgroundColor={'lime'} 
                            containerViewStyle={{ marginTop: 20 }} />
                    </View>
                </View>
            );
    }
};
