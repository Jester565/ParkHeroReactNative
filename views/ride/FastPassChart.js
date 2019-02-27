import React from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    processColor
} from 'react-native';

import update from 'immutability-helper';
import {LineChart} from 'react-native-charts-wrapper';
import moment from 'moment';

export default class FastPassChart extends React.Component {
    static navigationOptions = {
        title: 'FastPassChart',
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
            yAxis: {
                left: {
                    valueFormatter: 'date',
                    valueFormatterPattern: 'hh:mm',
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
            this.setGraphData(this.props.dps, this.props.rideCloseDateTime);
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.dps != null) {
            this.setGraphData(newProps.dps, newProps.rideCloseDateTime);
        }
    }

    setGraphData = (dps, rideCloseDateTime) => {
        var fpMaximum = moment(rideCloseDateTime, "YYYY-MM-DD HH:mm:ss");
        fpMaximum.subtract(30, 'minutes');
        var predictionValues = [];
        var historicalValues = [];
        for (var dp of dps) {
            var dateTime = moment(dp.dateTime, "YYYY-MM-DD HH:mm:ss");
            var hourFormatDateTime = dateTime.format("h:mm A");
            if (dp.history != null && dp.history.fastPassTime != null) {
                var fpTime = moment(dp.history.fastPassTime, "YYYY-MM-DD HH:mm:ss");
                historicalValues.push({
                    x: dateTime.valueOf(),
                    y: fpTime.valueOf(),
                    marker: fpTime.format("h:mm A") + " fastpass @ " + hourFormatDateTime
                });
            }
            if (dp.prediction != null && dp.prediction.fastPassTime != null) {
                var fpTime = moment(dp.prediction.fastPassTime, "YYYY-MM-DD HH:mm:ss");
                predictionValues.push({
                    x: dateTime.valueOf(),
                    y: fpTime.valueOf(),
                    marker: fpTime.format("h:mm A") + " fastpass @ " + hourFormatDateTime
                });
            }
        }
        if (historicalValues.length > 0 && predictionValues.length > 0) {
            predictionValues.unshift(historicalValues[historicalValues.length - 1]);
        }
        console.log("PREDICTION VALUES: ", JSON.stringify(predictionValues));

        var dataSets = [];
        if (predictionValues.length > 0) {
            dataSets.push({
                values: predictionValues,
                label: 'predictions',
                config: {
                    lineWidth: 1,
                    drawValues: false,
                    circleRadius: 5,
                    highlightEnabled: true,
                    drawHighlightIndicators: true,
                    color: processColor('red'),
                    drawFilled: true,
                    fillColor: processColor('red'),
                    fillAlpha: 45,
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
                        dataSets: dataSets
                    }
                },
                yAxis: {
                    left: {
                        $merge: {
                            axisMaximum: fpMaximum.valueOf()
                        }
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