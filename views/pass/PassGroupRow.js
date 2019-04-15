import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { CachedImage } from 'react-native-cached-image';
import moment from 'moment';
import Theme from '../../Theme';

export default class PassGroupRow extends React.PureComponent {
    onPress = () => {
        if (this.props.onPress) {
            this.props.onPress(this.props.id);
        }
    }

    onLongPress = () => {
        if (this.props.onLongPress) {
            this.props.onLongPress(this.props.id);
        }
    }

    render() {
        var fontSize = 18;
        var cardStyle = {
            width: "100%", 
            flex: 1, 
            flexDirection:'row', 
            justifyContent: 'flex-start',
            backgroundColor: this.props.color,
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.props.selected) {
            cardStyle.borderColor = "#0080ff";
        }
        var now = moment();
        var minsTillSelection = null;
        var selectionDateTimeStr = "Now";
        if (this.props.maxSelectionDateTime == null || this.props.maxSelectionDateTime <= now) {
            cardStyle.borderColor = "#7CFC00";
        } else {
            selectionDateTimeStr = this.props.maxSelectionDateTime.format("h:mm A");
            var duration = moment.duration(this.props.maxSelectionDateTime.diff(now));
            var minutes = duration.asMinutes();
            minsTillSelection = Math.round(minutes).toString() + " Mins";
        }
        var passNamesStr = "";

        for (var pass of this.props.passes) {
            if (passNamesStr.length > 0) {
                passNamesStr += ", ";
            }
            passNamesStr += (pass.name)? pass.name: pass.id.substr(pass.id.length - 5);
        }

        return (
            <TouchableOpacity
                onPress={this.onPress}
                onLongPress={this.onLongPress}>
                <View 
                    elevation={10} 
                    style={cardStyle}>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold' }}>
                                    {this.props.name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize * 0.9 }}>
                                    {passNamesStr}
                                </Text>
                            </View>
                        </View>
                        <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{textAlign: 'center', fontSize: fontSize }}>
                                    {selectionDateTimeStr}
                                </Text>
                            </View>
                            {
                                (minsTillSelection)? (
                                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                        <Text style={{textAlign: 'center', fontSize: fontSize}}>
                                            {minsTillSelection}
                                        </Text>
                                    </View>
                                ): null
                            }
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
  }