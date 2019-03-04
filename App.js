import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormLabel, FormInput, FormValidationMessage } from 'react-native-elements';
import Authenticator from './views/auth/Authenticator';
import SignUp from './views/auth/SignUp';
import Rides from './views/ride/Rides';
import ResortMap from './views/map/ResortMap';
import Matterhorn from './views/customride/Matterhorn';
import Home from './views/Home';
import Ride from './views/ride/Ride';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import Theme from './Theme';

const navigator = createStackNavigator({
    Home: {screen: Home},
    Ride: {screen: Ride}
  }, {
    cardStyle: {
      backgroundColor: Theme.SECONDARY_BACKGROUND
    }
});

const App = createAppContainer(navigator);

export default App;