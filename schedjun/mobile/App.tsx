import { NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useScheduleExactAlarmPermission } from 'expo-exact-alarms-permission';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { createScheduleApi, deleteSchedulesApi, listSchedulesApi, updateScheduleApi } from './api/scheduleApi';
import { ScheduleItem } from './constants/scheduleTypes';
import { colors, spacing } from './constants/theme';
import { scheduleToFormData } from './utils/scheduleDetailUtils';
import { scheduleVoToItem } from './utils/scheduleApiUtils';
import { getSchedulesForDate } from './utils/scheduleDetailUtils';
import {
  scheduleReminderForSchedule,
  syncScheduleReminders,
} from './utils/scheduleReminderNotifications';

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
  const hasExactAlarm = useScheduleExactAlarmPermission();
  const hadExactAlarmRef = useRef(hasExactAlarm);
  const [hasMoreSchedules, setHasMoreSchedules] = useState(false);
  const [loadingMoreSchedules, setLoadingMoreSchedules] = useState(false);
  const [scheduleDeleteBarVisible, setScheduleDeleteBarVisible] = useState(false);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const nextScheduleCursorRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (activeTab !== 'schedules') {
      setScheduleDeleteBarVisible(false);
    }
  }, [activeTab]);
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

  const loadSchedules = useCallback(async (includeToday = false) => {
    if (!accessToken) {
      setSchedules([]);
      setHasMoreSchedules(false);
      nextScheduleCursorRef.current = null;
      return;
    }

    if (!includeToday) {
      const data = await listSchedulesApi(accessToken, { limit: 20 });
      applyScheduleScroll(data, true);
      if (data.total !== undefined) {
        setTotalSchedules(data.total);
      }
      return;
    }

    // 初始化：列表 + 今日并行拉取，一次性 setState，避免闪白
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    lastFetchedDateRef.current = dateStr;

    const [listResult, todayResult] = await Promise.all([
      listSchedulesApi(accessToken, { limit: 20 }),
      listSchedulesApi(accessToken, { startDate: dateStr, endDate: dateStr, limit: 50 }),
    ]);

    // 合并两个结果后再一次性设置
    const listItems = listResult.records.map(scheduleVoToItem);
    const todayItems = todayResult.records.map(scheduleVoToItem);
    const merged = mergeScheduleItems(listItems, todayItems);
    setSchedules(merged);
    setHasMoreSchedules(listResult.hasMore);
    nextScheduleCursorRef.current = listResult.nextCursor;
    if (listResult.total !== undefined) {
      setTotalSchedules(listResult.total);
    }
  }, [accessToken, applyScheduleScroll, mergeScheduleItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSchedules(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadSchedules]);

  const lastFetchedDateRef = useRef<string | null>(null);

  const formatDateStr = useCallback((date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const handleCalendarSelectDate = useCallback(
    (date: Date) => {
      if (!accessToken) return;

      const existing = getSchedulesForDate(schedules, date);
      if (existing.length > 0) return;

      const dateStr = formatDateStr(date);
      if (dateStr === lastFetchedDateRef.current) return;
      lastFetchedDateRef.current = dateStr;

      listSchedulesApi(accessToken, { startDate: dateStr, endDate: dateStr, limit: 50 })
        .then((data) => applyScheduleScroll(data, false))
        .catch((err) => console.error('[schedules] date fetch failed:', err));
    },
    [accessToken, schedules, formatDateStr, applyScheduleScroll],
  );

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
      initialLoadDoneRef.current = false;
      return;
    }

    // Token 刷新时不重复拉取，避免 reset=true 覆盖已合并的按日数据
    if (initialLoadDoneRef.current) {
      return;
    }
    initialLoadDoneRef.current = true;

    loadSchedules(true).catch((error) => {
      console.error('[schedules] load failed:', error);
    });
  }, [isBootstrapping, isLoggedIn, accessToken, loadSchedules]);

  useEffect(() => {
    if (isBootstrapping || !isLoggedIn) {
      return;
    }

    const timer = setTimeout(() => {
      syncScheduleReminders(schedules).catch((error) => {
        console.error('[reminder] sync failed:', error);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [isBootstrapping, isLoggedIn, schedules]);

  // 用户从设置页开启精确闹钟后，重新注册系统通知（从不精确切换为精确）
  useEffect(() => {
    if (isBootstrapping || !isLoggedIn) {
      return;
    }

    const becameGranted = !hadExactAlarmRef.current && hasExactAlarm;
    hadExactAlarmRef.current = hasExactAlarm;

    if (becameGranted) {
      syncScheduleReminders(schedules).catch((error) => {
        console.error('[reminder] resync after exact alarm grant failed:', error);
      });
    }
  }, [hasExactAlarm, isBootstrapping, isLoggedIn, schedules]);

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
      setTotalSchedules((prev) => prev + 1);
      await scheduleReminderForSchedule(item);
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

  const handleDeleteSchedules = useCallback(
    async (scheduleIds: string[]) => {
      if (scheduleIds.length === 0) {
        return;
      }

      if (!isLoggedIn || !accessToken) {
        Alert.alert('提示', '请先登录后再删除日程');
        return;
      }

      await deleteSchedulesApi(accessToken, scheduleIds);
      const idSet = new Set(scheduleIds);
      setSchedules((prev) => prev.filter((item) => !idSet.has(item.id)));
      setTotalSchedules((prev) => Math.max(0, prev - scheduleIds.length));
      if (selectedScheduleId && idSet.has(selectedScheduleId)) {
        setSelectedScheduleId(null);
      }
    },
    [selectedScheduleId, accessToken, isLoggedIn],
  );

  const handleDeleteSchedule = useCallback(async () => {
    if (!selectedScheduleId) {
      return;
    }

    try {
      await handleDeleteSchedules([selectedScheduleId]);
    } catch (error) {
      Alert.alert('提示', error instanceof Error ? error.message : '删除失败');
    }
  }, [selectedScheduleId, handleDeleteSchedules]);

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
      await scheduleReminderForSchedule(item);
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

  let screenContent;

  if (overlayScreen === 'createEvent') {
    screenContent = (
      <CreateEventScreen
        initialDate={createEventDate}
        onClose={handleCloseCreate}
        onSave={handleSaveEvent}
      />
    );
  } else if (overlayScreen === 'editEvent' && editingSchedule) {
    screenContent = (
      <EditEventScreen
        initialData={scheduleToFormData(editingSchedule)}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
    );
  } else {
    screenContent = (
      <>
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
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={[colors.primary]}
                      tintColor={colors.primary}
                    />
                  }
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: tabBarInset + spacing.sm },
                  ]}
                >
                  <CalendarView
                    schedules={schedules}
                    onAddPress={handleCalendarAddPress}
                    onSchedulePress={openScheduleDetail}
                    onSelectDate={handleCalendarSelectDate}
                  />
                </ScrollView>
              </SafeAreaView>
            </LinearGradient>
          )}

          {activeTab === 'schedules' && (
            <MyScheduleScreen
              embedded
              schedules={schedules}
              onDeleteSchedules={handleDeleteSchedules}
              onDeleteBarVisibleChange={setScheduleDeleteBarVisible}
              onAddPress={handleScheduleAddPress}
              onSchedulePress={openScheduleDetail}
              onLoadMore={loadMoreSchedules}
              hasMore={hasMoreSchedules}
              loadingMore={loadingMoreSchedules}
              bottomInset={tabBarInset}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'mine' && (
            <MineScreen scheduleCount={totalSchedules} bottomInset={tabBarInset} onTabChange={setActiveTab} refreshing={refreshing} onRefresh={handleRefresh} />
          )}

          {!(activeTab === 'schedules' && scheduleDeleteBarVisible) && (
            <View style={styles.tabBarWrap}>
              <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </View>
          )}
        </View>

        {selectedSchedule && (
          <ScheduleDetailScreen
            schedule={selectedSchedule}
            onClose={closeScheduleDetail}
            onEdit={openScheduleEdit}
            onDelete={handleDeleteSchedule}
          />
        )}
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {screenContent}
      <FloatingAssistant isLoggedIn={isLoggedIn} onScheduleCreated={loadSchedules} />
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
