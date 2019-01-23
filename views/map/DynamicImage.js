import React, { Component } from 'react';
import { Image } from 'react-native';

export default class DynamicImage extends Component {
    static navigationOptions = {
        title: 'LargeImage',
        header: null
    };

    constructor(props) {
        super(props);
    }

    render() {
        return <Image style={this.props.style} source={this.props.source} />
    }
}