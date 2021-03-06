import Main from './views/Main';
import Ride from './views/ride/Ride';
import Event from './views/ride/Event';
import Authenticator from './views/auth/Authenticator';
import Profile from './views/profile/Profile';
import PassPicker from './views/pass/PassPicker';
import Friends from './views/profile/Friends';
import ScheduleCalendar from './views/ride/ScheduleCalendar';
import RideSelector from './views/ride/RideSelector';
import ResortMap from './views/map/ResortMap';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import Theme from './Theme';
import NetManager from './NetManager';
import Camera from './views/media/Camera';

NetManager.init();

const navigator = createStackNavigator({
    Main: {screen: Main},
    Auth: {screen: Authenticator},
    Profile: {screen: Profile},
    Ride: {screen: Ride},
    Event: {screen: Event},
    PassPicker: {screen: PassPicker},
    Friends: {screen: Friends},
    ScheduleCalendar: {screen: ScheduleCalendar},
    RideSelector: {screen: RideSelector},
    ResortMap: {screen: ResortMap},
    Camera: {screen: Camera}
  }, {
    cardStyle: {
      backgroundColor: Theme.SECONDARY_BACKGROUND
    }
});

const App = createAppContainer(navigator);

export default App;