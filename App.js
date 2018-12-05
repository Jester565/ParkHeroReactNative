import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage } from 'react-native-elements';
import Authenticator from './views/auth/Authenticator';
import SignUp from './views/auth/SignUp';
import RideList from './views/ride/RideList';
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
  RideList: {screen: RideList},
  Auth: {screen: Authenticator},
  SignUp: {screen: SignUp}
});

const App = createAppContainer(navigator);

export default App;