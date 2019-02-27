import React from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    processColor
} from 'react-native';

import Theme from '../../Theme';
import update from 'immutability-helper';
import {LineChart} from 'react-native-charts-wrapper';
import _ from 'lodash';
import moment from 'moment';

export default class WaitTimeChart extends React.Component {
    static navigationOptions = {
        title: 'WaitTimeChart',
        header: null
    };

    constructor(props) {
        super();

        this.state = {
            data: {},
            legend: {
              enabled: true,
              textColor: processColor('white'),
              textSize: 12,
              form: 'SQUARE',
              formSize: 14,
              xEntrySpace: 10,
              yEntrySpace: 5,
              formToTextSpace: 5,
              wordWrapEnabled: true,
              maxSizePercent: 0.5,
              custom: {
                colors: [processColor('red'), processColor('blue')],
                labels: ['Predictions', 'History',]
              }
            },
            marker: {
              enabled: true,
              markerColor: processColor('#222222BC'),
              textColor: processColor('white'),
              markerFontSize: 14,
            },
            selectedEntry: "",
            yAxis: {
                left: {
                    enabled: true,
                    textColor: processColor('white')
                },
                right: {enabled: false}
            },
            xAxis: {
                valueFormatter: 'date',
                valueFormatterPattern: 'hh:mm',
                position: 'BOTTOM',
                textColor: processColor('white')
            }
        }
    }

    componentWillMount() {
        if (this.props.dps != null) {
            this.setGraphData(this.props.dps);
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.dps != null) {
            this.setGraphData(newProps.dps);
        }
    }

    setGraphData = (dps) => {
        var predictionValues = [];
        var historicalValues = [];
        for (var dp of dps) {
            var dateTime = moment(dp.dateTime, "YYYY-MM-DD HH:mm:ss");
            var hourFormatDateTime = dateTime.format("h:mm A");
            if (dp.history != null && dp.history.waitMins != null) {
                historicalValues.push({
                    x: dateTime.valueOf(),
                    y: dp.history.waitMins,
                    marker: dp.history.waitMins.toString() + " min wait @ " + hourFormatDateTime
                });
            }
            if (dp.prediction != null && dp.prediction.waitMins != null) {
                predictionValues.push({
                    x: dateTime.valueOf(),
                    y: dp.prediction.waitMins,
                    marker: dp.prediction.waitMins.toString() + " min wait @ " + hourFormatDateTime
                });
            }
        }

        var dataSets = [];
        if (predictionValues.length > 0) {
            dataSets.push({
                values: predictionValues,
                label: 'predictions',
                config: {
                    lineWidth: 1,
                    drawValues: true,
                    circleRadius: 5,
                    highlightEnabled: true,
                    drawHighlightIndicators: true,
                    color: processColor('red'),
                    drawFilled: true,
                    valueTextSize:10,
                    fillColor: processColor('red'),
                    fillAlpha: 45,
                    valueFormatter: "###",
                    circleColor: processColor('red'),
                    valueTextColor: processColor('white')
                }
            });
        }
        if (historicalValues.length > 0) {
            dataSets.push({
                values: historicalValues,
                label: 'history',
                config: {
                    lineWidth: 1,
                    drawValues: false,
                    circleRadius: 5,
                    highlightEnabled: true,
                    drawHighlightIndicators: true,
                    color: processColor('blue'),
                    drawFilled: true,
                    fillColor: processColor('blue'),
                    fillAlpha: 45,
                    circleColor: processColor('blue')
                }
            });
        }
        this.setState(
            update(this.state, {
                data: {
                    $set: {
                        dataSets: dataSets,
                    }
                }
            }));
    }

    render() {
        let borderColor = processColor("red");

        if (this.state.data.dataSets.length == 0) {
            return <View />;
        }
        return (
        <View style={{flex: 1}}>
            <LineChart
            style={styles.chart}
            data={this.state.data}
            chartDescription={{text: ''}}
            legend={this.state.legend}
            marker={this.state.marker}

            drawGridBackground={true}

            borderColor={borderColor}
            gridBackgroundColor={processColor("black")}
            borderWidth={1}
            drawBorders={true}
            xAxis={this.state.xAxis}
            yAxis={this.state.yAxis}

            ref="chart"
            />
        </View>);
    }
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#222222'
    },
    chart: {
      flex: 1,
      backgroundColor: "#222222"
    }
});