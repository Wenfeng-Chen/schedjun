import { registerRootComponent } from 'expo';

import App from './App';
import { initScheduleReminderNotifications } from './utils/scheduleReminderNotifications';

import 'react-native-reanimated';

initScheduleReminderNotifications();

registerRootComponent(App);
