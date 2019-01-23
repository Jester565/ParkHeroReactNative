import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage } from 'react-native-elements';
import Authenticator from './views/auth/Authenticator';
import SignUp from './views/auth/SignUp';
import Rides from './views/ride/Rides';
import ResortMap from './views/map/ResortMap';
import Home from './views/Home';
import Matterhorn from './Matterhorn';
import { createStackNavigator, createAppContainer } from 'react-navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTitle: {
    fontSize: 30
  }
});

const navigator = createStackNavigator({
  Home: {screen: Home}
});

const App = createAppContainer(navigator);

export default App;