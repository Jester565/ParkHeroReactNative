import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CheckBox } from 'react-native-elements';
import NumericInput from 'react-native-numeric-input'
import { CachedImage } from 'react-native-cached-image';
import moment from 'moment';
import Theme from '../../Theme';

export default class PassCreatorRow extends React.PureComponent {
    onCheck = () => {
        this.props.onCheckPressed(this.props.id);
    }

    onPriorityChanged = (priority) => {
        this.props.onPriorityChanged(this.props.id, priority);
    }

    render() {
        var fontSize = 18;
        var cardStyle = {
            width: "100%", 
            backgroundColor: (this.props.enabled)? "#FFFFFF": "#222222",
            padding: 5,
            borderRadius: 5,
            borderWidth: 3,
            borderColor: '#333333'
        };
        if (this.props.enabled) {
            cardStyle.borderColor = "#0080ff";
        }

        return (
            <View 
                elevation={10} 
                style={cardStyle}>
                <View style={{ width: "100%", flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignContent: 'center' }}>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 1.2, fontWeight: 'bold', color: (this.props.enabled)? 'black': 'white' }}>
                                {this.props.name}
                            </Text>
                        </View>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text numberOfLines={1} style={{textAlign: 'center', fontSize: fontSize * 0.9, color: (this.props.enabled)? 'black': 'white' }}>
                                {this.props.selectionDateTimeStr}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: "100%", flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignContent: 'center' }}>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <CheckBox
                            title='Get Pass'
                            checked={this.props.enabled}
                            onPress={this.onCheck} />
                        </View>
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <NumericInput
                                value={this.props.currentPriority}
                                initValue={this.props.currentPriority}
                                maxValue={this.props.maxPriority}
                                minValue={0}
                                textColor={(this.props.enabled)? 'black': 'white'}
                                onChange={this.onPriorityChanged} />
                        </View>
                    </View>
                </View>
            </View>
        );
    }
}