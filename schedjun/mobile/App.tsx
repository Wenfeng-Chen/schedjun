import { NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import CalendarView from './components/calendar/CalendarView';
import CreateEventScreen, { EventFormData } from './components/event/CreateEventScreen';
import MyScheduleScreen from './components/schedule/MyScheduleScreen';
import { colors } from './constants/theme';

type AppScreen = 'home' | 'createEvent' | 'mySchedule';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [createEventDate, setCreateEventDate] = useState<Date>(() => new Date());

  const [fontsLoaded] = useFonts({
    NotoSerifSC_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const handleAddPress = (selectedDate: Date) => {
    setCreateEventDate(selectedDate);
    setScreen('createEvent');
  };

  const handleSaveEvent = (_data: EventFormData) => {
    // 后续 PR 接入日程存储
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (screen === 'createEvent') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <CreateEventScreen
          initialDate={createEventDate}
          onClose={() => setScreen('home')}
          onSave={handleSaveEvent}
        />
      </SafeAreaProvider>
    );
  }

  if (screen === 'mySchedule') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <MyScheduleScreen onBack={() => setScreen('home')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={[colors.backgroundWarm, colors.backgroundCool]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <StatusBar style="dark" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <CalendarView
              onAddPress={handleAddPress}
              onMySchedulePress={() => setScreen('mySchedule')}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundWarm,
  },
});
