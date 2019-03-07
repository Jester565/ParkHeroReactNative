import Main from './views/Main';
import Ride from './views/ride/Ride';
import Authenticator from './views/auth/Authenticator';
import Profile from './views/profile/Profile';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import Theme from './Theme';

const navigator = createStackNavigator({
    Main: {screen: Main},
    Auth: {screen: Authenticator},
    Profile: {screen: Profile},
    Ride: {screen: Ride}
  }, {
    cardStyle: {
      backgroundColor: Theme.SECONDARY_BACKGROUND
    }
});

const App = createAppContainer(navigator);

export default App;