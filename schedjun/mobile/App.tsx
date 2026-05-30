import { NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import FloatingAssistant from './components/assistant/FloatingAssistant';
import CalendarView from './components/calendar/CalendarView';
import CreateEventScreen, { EventFormData } from './components/event/CreateEventScreen';
import EditEventScreen, { EditEventFormData } from './components/event/EditEventScreen';
import MyScheduleScreen from './components/schedule/MyScheduleScreen';
import ScheduleDetailScreen from './components/schedule/ScheduleDetailScreen';
import { MOCK_SCHEDULES } from './constants/mockSchedules';
import { ScheduleItem } from './constants/scheduleTypes';
import { colors } from './constants/theme';
import { formDataToSchedule, scheduleToFormData } from './utils/scheduleDetailUtils';

type AppScreen = 'home' | 'createEvent' | 'mySchedule' | 'editEvent';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [createEventDate, setCreateEventDate] = useState<Date>(() => new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() =>
    MOCK_SCHEDULES.map((item) => ({
      ...item,
      startTime: new Date(item.startTime),
      endTime: new Date(item.endTime),
    })),
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [returnScreen, setReturnScreen] = useState<AppScreen>('home');

  const [fontsLoaded] = useFonts({
    NotoSerifSC_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const selectedSchedule = useMemo(
    () => schedules.find((item) => item.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const editingSchedule = useMemo(
    () => schedules.find((item) => item.id === editingScheduleId) ?? null,
    [schedules, editingScheduleId],
  );

  const handleAddPress = (selectedDate: Date) => {
    setCreateEventDate(selectedDate);
    setScreen('createEvent');
  };

  const handleSaveEvent = (_data: EventFormData) => {
    // 后续 PR 接入日程存储
  };

  const openScheduleDetail = useCallback((scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
  }, []);

  const closeScheduleDetail = useCallback(() => {
    setSelectedScheduleId(null);
  }, []);

  const openScheduleEdit = useCallback(() => {
    if (!selectedScheduleId) {
      return;
    }
    setReturnScreen(screen);
    setEditingScheduleId(selectedScheduleId);
    setScreen('editEvent');
  }, [selectedScheduleId, screen]);

  const handleDeleteSchedule = useCallback(() => {
    if (!selectedScheduleId) {
      return;
    }
    setSchedules((prev) => prev.filter((item) => item.id !== selectedScheduleId));
    setSelectedScheduleId(null);
  }, [selectedScheduleId]);

  const handleSaveEdit = useCallback(
    (data: EditEventFormData) => {
      if (!editingScheduleId) {
        return;
      }
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === editingScheduleId ? formDataToSchedule(editingScheduleId, data) : item,
        ),
      );
      setScreen(returnScreen);
      setEditingScheduleId(null);
    },
    [editingScheduleId, returnScreen],
  );

  const handleCloseEdit = useCallback(() => {
    setEditingScheduleId(null);
    setScreen(returnScreen);
  }, [returnScreen]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const assistantOverlay = <FloatingAssistant />;

  if (screen === 'createEvent') {
    return (
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <CreateEventScreen
            initialDate={createEventDate}
            onClose={() => setScreen('home')}
            onSave={handleSaveEvent}
          />
          {assistantOverlay}
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'editEvent' && editingSchedule) {
    return (
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <EditEventScreen
            initialData={scheduleToFormData(editingSchedule)}
            onClose={handleCloseEdit}
            onSave={handleSaveEdit}
          />
          {assistantOverlay}
        </View>
      </SafeAreaProvider>
    );
  }

  if (screen === 'mySchedule') {
    return (
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <MyScheduleScreen
            schedules={schedules}
            onSchedulesChange={setSchedules}
            onBack={() => setScreen('home')}
            onSchedulePress={openScheduleDetail}
          />
          {selectedSchedule && (
            <ScheduleDetailScreen
              schedule={selectedSchedule}
              onClose={closeScheduleDetail}
              onEdit={openScheduleEdit}
              onDelete={handleDeleteSchedule}
            />
          )}
          {assistantOverlay}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
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
              schedules={schedules}
              onAddPress={handleAddPress}
              onMySchedulePress={() => setScreen('mySchedule')}
              onSchedulePress={openScheduleDetail}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {selectedSchedule && screen === 'home' && (
        <ScheduleDetailScreen
          schedule={selectedSchedule}
          onClose={closeScheduleDetail}
          onEdit={openScheduleEdit}
          onDelete={handleDeleteSchedule}
        />
      )}
      {assistantOverlay}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
