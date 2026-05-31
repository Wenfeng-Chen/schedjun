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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FloatingAssistant from './components/assistant/FloatingAssistant';
import CalendarView from './components/calendar/CalendarView';
import CreateEventScreen, { EventFormData } from './components/event/CreateEventScreen';
import EditEventScreen, { EditEventFormData } from './components/event/EditEventScreen';
import BottomTabBar, { MainTab, TAB_BAR_HEIGHT } from './components/navigation/BottomTabBar';
import MineScreen from './components/profile/MineScreen';
import MyScheduleScreen from './components/schedule/MyScheduleScreen';
import ScheduleDetailScreen from './components/schedule/ScheduleDetailScreen';
import { AuthProvider } from './context/AuthContext';
import { MOCK_SCHEDULES } from './constants/mockSchedules';
import { ScheduleItem } from './constants/scheduleTypes';
import { colors, spacing } from './constants/theme';
import { formDataToSchedule, scheduleToFormData } from './utils/scheduleDetailUtils';

type OverlayScreen = 'createEvent' | 'editEvent' | null;

function MainApp() {
  const insets = useSafeAreaInsets();
  const tabBarInset = TAB_BAR_HEIGHT + Math.max(insets.bottom, spacing.sm);

  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>(null);
  const [returnTab, setReturnTab] = useState<MainTab>('calendar');
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

  const selectedSchedule = useMemo(
    () => schedules.find((item) => item.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const editingSchedule = useMemo(
    () => schedules.find((item) => item.id === editingScheduleId) ?? null,
    [schedules, editingScheduleId],
  );

  const openCreateEvent = useCallback((date: Date, fromTab: MainTab = activeTab) => {
    setCreateEventDate(date);
    setReturnTab(fromTab);
    setOverlayScreen('createEvent');
  }, [activeTab]);

  const handleCalendarAddPress = useCallback(
    (selectedDate: Date) => {
      openCreateEvent(selectedDate, 'calendar');
    },
    [openCreateEvent],
  );

  const handleScheduleAddPress = useCallback(() => {
    openCreateEvent(new Date(), 'schedules');
  }, [openCreateEvent]);

  const handleSaveEvent = (_data: EventFormData) => {
    setOverlayScreen(null);
    setActiveTab(returnTab);
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
    setReturnTab(activeTab);
    setEditingScheduleId(selectedScheduleId);
    setOverlayScreen('editEvent');
  }, [selectedScheduleId, activeTab]);

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
      setOverlayScreen(null);
      setActiveTab(returnTab);
      setEditingScheduleId(null);
    },
    [editingScheduleId, returnTab],
  );

  const handleCloseEdit = useCallback(() => {
    setEditingScheduleId(null);
    setOverlayScreen(null);
    setActiveTab(returnTab);
  }, [returnTab]);

  const handleCloseCreate = useCallback(() => {
    setOverlayScreen(null);
    setActiveTab(returnTab);
  }, [returnTab]);

  if (overlayScreen === 'createEvent') {
    return (
      <>
        <StatusBar style="dark" />
        <CreateEventScreen
          initialDate={createEventDate}
          onClose={handleCloseCreate}
          onSave={handleSaveEvent}
        />
        <FloatingAssistant />
      </>
    );
  }

  if (overlayScreen === 'editEvent' && editingSchedule) {
    return (
      <>
        <StatusBar style="dark" />
        <EditEventScreen
          initialData={scheduleToFormData(editingSchedule)}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
        <FloatingAssistant />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.main}>
        {activeTab === 'calendar' && (
          <LinearGradient
            colors={[colors.backgroundWarm, colors.backgroundCool]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <SafeAreaView style={styles.container} edges={['top']}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: tabBarInset + spacing.sm },
                ]}
              >
                <CalendarView
                  schedules={schedules}
                  onAddPress={handleCalendarAddPress}
                  onSchedulePress={openScheduleDetail}
                />
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        )}

        {activeTab === 'schedules' && (
          <MyScheduleScreen
            embedded
            schedules={schedules}
            onSchedulesChange={setSchedules}
            onAddPress={handleScheduleAddPress}
            onSchedulePress={openScheduleDetail}
            bottomInset={tabBarInset}
          />
        )}

        {activeTab === 'mine' && (
          <MineScreen scheduleCount={schedules.length} bottomInset={tabBarInset} />
        )}

        <View style={styles.tabBarWrap}>
          <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </View>

      {selectedSchedule && (
        <ScheduleDetailScreen
          schedule={selectedSchedule}
          onClose={closeScheduleDetail}
          onEdit={openScheduleEdit}
          onDelete={handleDeleteSchedule}
        />
      )}

      <FloatingAssistant />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerifSC_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  main: {
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
  },
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundWarm,
  },
});
