import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage } from 'react-native-elements';
import Auth from './Auth';
import SignUp from './SignUp';
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
  Auth: {screen: Auth},
  SignUp: {screen: SignUp}
});

const App = createAppContainer(navigator);

export default App;