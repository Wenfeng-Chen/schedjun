import { NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FloatingAssistant from './components/assistant/FloatingAssistant';
import CalendarView from './components/calendar/CalendarView';
import CreateEventScreen, { EventFormData } from './components/event/CreateEventScreen';
import EditEventScreen, { EditEventFormData } from './components/event/EditEventScreen';
import BottomTabBar, { MainTab, TAB_BAR_HEIGHT } from './components/navigation/BottomTabBar';
import MineScreen from './components/profile/MineScreen';
import MyScheduleScreen from './components/schedule/MyScheduleScreen';
import ScheduleDetailScreen from './components/schedule/ScheduleDetailScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { createScheduleApi, deleteScheduleApi, listSchedulesApi, updateScheduleApi } from './api/scheduleApi';
import { ScheduleItem } from './constants/scheduleTypes';
import { colors, spacing } from './constants/theme';
import { scheduleToFormData } from './utils/scheduleDetailUtils';
import { scheduleVoToItem } from './utils/scheduleApiUtils';

type OverlayScreen = 'createEvent' | 'editEvent' | null;

function MainApp() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, accessToken, isBootstrapping } = useAuth();
  const tabBarInset = TAB_BAR_HEIGHT + Math.max(insets.bottom, spacing.sm);

  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>(null);
  const [returnTab, setReturnTab] = useState<MainTab>('calendar');
  const [createEventDate, setCreateEventDate] = useState<Date>(() => new Date());
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [hasMoreSchedules, setHasMoreSchedules] = useState(false);
  const [loadingMoreSchedules, setLoadingMoreSchedules] = useState(false);
  const nextScheduleCursorRef = useRef<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const mergeScheduleItems = useCallback((current: ScheduleItem[], incoming: ScheduleItem[]) => {
    if (incoming.length === 0) {
      return current;
    }

    const existingIds = new Set(current.map((item) => item.id));
    const merged = [...current];

    incoming.forEach((item) => {
      if (!existingIds.has(item.id)) {
        merged.push(item);
      }
    });

    return merged.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, []);

  const applyScheduleScroll = useCallback(
    (data: Awaited<ReturnType<typeof listSchedulesApi>>, reset: boolean) => {
      const items = data.records.map(scheduleVoToItem);
      setSchedules((prev) => (reset ? items : mergeScheduleItems(prev, items)));
      setHasMoreSchedules(data.hasMore);
      nextScheduleCursorRef.current = data.nextCursor;
    },
    [mergeScheduleItems],
  );

  const loadSchedules = useCallback(async () => {
    if (!accessToken) {
      setSchedules([]);
      setHasMoreSchedules(false);
      nextScheduleCursorRef.current = null;
      return;
    }

    const data = await listSchedulesApi(accessToken);
    applyScheduleScroll(data, true);
  }, [accessToken, applyScheduleScroll]);

  const loadMoreSchedules = useCallback(async () => {
    if (!accessToken || !hasMoreSchedules || loadingMoreSchedules || !nextScheduleCursorRef.current) {
      return;
    }

    setLoadingMoreSchedules(true);
    try {
      const data = await listSchedulesApi(accessToken, {
        cursor: nextScheduleCursorRef.current,
      });
      applyScheduleScroll(data, false);
    } catch (error) {
      console.error('[schedules] load more failed:', error);
    } finally {
      setLoadingMoreSchedules(false);
    }
  }, [accessToken, applyScheduleScroll, hasMoreSchedules, loadingMoreSchedules]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isLoggedIn || !accessToken) {
      setSchedules([]);
      setHasMoreSchedules(false);
      nextScheduleCursorRef.current = null;
      return;
    }

    loadSchedules().catch((error) => {
      console.error('[schedules] load failed:', error);
    });
  }, [isBootstrapping, isLoggedIn, accessToken, loadSchedules]);

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

  const handleSaveEvent = useCallback(
    async (data: EventFormData) => {
      if (!isLoggedIn || !accessToken) {
        throw new Error('请先登录后再创建日程');
      }

      const created = await createScheduleApi(accessToken, data);
      const item = scheduleVoToItem(created);
      setSchedules((prev) =>
        [...prev, item].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      );
    },
    [accessToken, isLoggedIn],
  );

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

  const handleDeleteSchedule = useCallback(async () => {
    if (!selectedScheduleId) {
      return;
    }

    if (!isLoggedIn || !accessToken) {
      Alert.alert('提示', '请先登录后再删除日程');
      return;
    }

    try {
      await deleteScheduleApi(accessToken, selectedScheduleId);
      setSchedules((prev) => prev.filter((item) => item.id !== selectedScheduleId));
      setSelectedScheduleId(null);
    } catch (error) {
      Alert.alert('提示', error instanceof Error ? error.message : '删除失败');
    }
  }, [selectedScheduleId, accessToken, isLoggedIn]);

  const handleSaveEdit = useCallback(
    async (data: EditEventFormData) => {
      if (!editingScheduleId) {
        return;
      }

      if (!isLoggedIn || !accessToken) {
        throw new Error('请先登录后再更新日程');
      }

      const updated = await updateScheduleApi(accessToken, editingScheduleId, data);
      const item = scheduleVoToItem(updated);
      setSchedules((prev) =>
        prev
          .map((schedule) => (schedule.id === editingScheduleId ? item : schedule))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      );
      setOverlayScreen(null);
      setActiveTab(returnTab);
      setEditingScheduleId(null);
    },
    [editingScheduleId, returnTab, accessToken, isLoggedIn],
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
        <FloatingAssistant onScheduleCreated={loadSchedules} />
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
        <FloatingAssistant onScheduleCreated={loadSchedules} />
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
            onLoadMore={loadMoreSchedules}
            hasMore={hasMoreSchedules}
            loadingMore={loadingMoreSchedules}
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

      <FloatingAssistant onScheduleCreated={loadSchedules} />
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
