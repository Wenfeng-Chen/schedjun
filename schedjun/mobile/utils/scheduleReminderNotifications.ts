/**
 * 日程提醒 — 系统通知层
 *
 * Android：原生 AlarmManager + 系统 Notification（前台/后台均弹系统悬浮横幅）
 * iOS：expo-notifications 本地通知
 */
import { Platform } from 'react-native';

import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import {
  AndroidNotificationPriority,
  SchedulableTriggerInputTypes,
} from 'expo-notifications/build/Notifications.types';
import type { NotificationRequest } from 'expo-notifications/build/Notifications.types';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { ScheduleItem } from '../constants/scheduleTypes';
import { floorToMinute } from './dateTimeUtils';
import { logExactAlarmStatus } from './exactAlarmPermission';
import {
  buildReminderNotificationBody,
  buildReminderTriggerKey,
  getReminderTriggerTimestamp,
  resolveReminderTriggerDate,
} from './reminderUtils';
import {
  isNativeScheduleReminderAvailable,
  nativeCancelOrphanReminders,
  nativeCancelReminder,
  nativeScheduleReminder,
} from './scheduleReminderNative';

export const SCHEDULE_REMINDER_PREFIX = 'schedjun-reminder-';

let initialized = false;
const lastSyncedTriggerKey = new Map<string, string>();

function useNativeAndroidReminders(): boolean {
  return isNativeScheduleReminderAvailable();
}

export function reminderNotificationId(scheduleId: string): string {
  return `${SCHEDULE_REMINDER_PREFIX}${scheduleId}`;
}

function formatScheduleTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function initScheduleReminderNotifications(): void {
  if (initialized || Platform.OS === 'web') {
    return;
  }

  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        priority: AndroidNotificationPriority.MAX,
      }),
    });
    initialized = true;
  } catch (error) {
    console.warn('[reminder] init handler failed:', error);
  }
}

export async function ensureReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const current = await getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    const requested = await requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return requested.granted;
  } catch (error) {
    console.warn('[reminder] permission failed:', error);
    return false;
  }
}

function buildNotificationPayload(schedule: ScheduleItem) {
  const startTime = floorToMinute(schedule.startTime);
  const timeLabel = formatScheduleTime(startTime);
  const detail = buildReminderNotificationBody(schedule.title, schedule.reminder);
  const triggerMs = getReminderTriggerTimestamp(startTime, schedule.reminder);

  return {
    triggerMs,
    triggerKey: triggerMs === null ? null : buildReminderTriggerKey(schedule.id, triggerMs),
    title: schedule.title,
    body: `时间 ${timeLabel} · ${detail}`,
  };
}

async function clearLegacyExpoReminders(): Promise<void> {
  try {
    const scheduled = await getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => item.identifier.startsWith(SCHEDULE_REMINDER_PREFIX))
        .map((item) => cancelScheduledNotificationAsync(item.identifier)),
    );
  } catch {
    // ignore
  }
}

async function scheduleReminderWithExpo(
  schedule: ScheduleItem,
  existing?: Map<string, NotificationRequest>,
): Promise<void> {
  const { triggerMs, triggerKey, title, body } = buildNotificationPayload(schedule);
  const identifier = reminderNotificationId(schedule.id);
  const triggerDate = resolveReminderTriggerDate(schedule.startTime, schedule.reminder);

  if (!triggerDate || triggerMs === null || !triggerKey) {
    await cancelScheduledNotificationAsync(identifier).catch(() => undefined);
    lastSyncedTriggerKey.delete(identifier);
    return;
  }

  const prev = existing?.get(identifier);
  if (prev?.content.data?.triggerKey === triggerKey) {
    lastSyncedTriggerKey.set(identifier, triggerKey);
    return;
  }

  await cancelScheduledNotificationAsync(identifier).catch(() => undefined);

  await scheduleNotificationAsync({
    identifier,
    content: {
      title,
      subtitle: 'Schedjun 日程',
      body,
      sound: Platform.OS === 'ios' ? 'default' : true,
      priority: AndroidNotificationPriority.MAX,
      vibrate: [0, 280, 160, 280],
      data: {
        type: 'schedule_reminder',
        scheduleId: schedule.id,
        triggerKey,
        triggerMs: String(triggerMs),
      },
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'active' as const } : {}),
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  lastSyncedTriggerKey.set(identifier, triggerKey);
}

async function scheduleReminderWithNative(schedule: ScheduleItem): Promise<void> {
  const { triggerMs, triggerKey, title, body } = buildNotificationPayload(schedule);
  const identifier = reminderNotificationId(schedule.id);
  const triggerDate = resolveReminderTriggerDate(schedule.startTime, schedule.reminder);

  if (!triggerDate || triggerMs === null || !triggerKey) {
    await nativeCancelReminder(identifier);
    lastSyncedTriggerKey.delete(identifier);
    return;
  }

  if (lastSyncedTriggerKey.get(identifier) === triggerKey) {
    return;
  }

  await nativeScheduleReminder({
    identifier,
    title,
    body,
    scheduleId: schedule.id,
    triggerKey,
    triggerMs,
  });

  lastSyncedTriggerKey.set(identifier, triggerKey);
}

export async function scheduleReminderForSchedule(
  schedule: ScheduleItem,
  existing?: Map<string, NotificationRequest>,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  initScheduleReminderNotifications();
  if (!(await ensureReminderPermissions())) {
    return;
  }

  if (useNativeAndroidReminders()) {
    await scheduleReminderWithNative(schedule);
    return;
  }

  await scheduleReminderWithExpo(schedule, existing);
}

export async function syncScheduleReminders(schedules: ScheduleItem[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  initScheduleReminderNotifications();
  if (!(await ensureReminderPermissions())) {
    return;
  }

  logExactAlarmStatus();

  const activeIds = schedules.map((schedule) => schedule.id);

  if (useNativeAndroidReminders()) {
    await clearLegacyExpoReminders();
    await nativeCancelOrphanReminders(activeIds);

    for (const schedule of schedules) {
      await scheduleReminderWithNative(schedule);
    }
    return;
  }

  const activeIdSet = new Set(activeIds);
  const scheduled = await getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(SCHEDULE_REMINDER_PREFIX))
      .filter((item) => {
        const scheduleId = item.content.data?.scheduleId;
        return typeof scheduleId !== 'string' || !activeIdSet.has(scheduleId);
      })
      .map((item) => cancelScheduledNotificationAsync(item.identifier)),
  );

  const existing = new Map(
    scheduled
      .filter((item) => item.identifier.startsWith(SCHEDULE_REMINDER_PREFIX))
      .map((item) => [item.identifier, item]),
  );

  for (const schedule of schedules) {
    await scheduleReminderWithExpo(schedule, existing);
  }
}

export async function snoozeReminderNotification(
  scheduleId: string,
  title: string,
  body: string,
  minutes = 5,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (!(await ensureReminderPermissions())) {
    return;
  }

  const triggerDate = new Date(Date.now() + minutes * 60 * 1000);
  const triggerKey = buildReminderTriggerKey(scheduleId, triggerDate.getTime());
  const identifier = `${SCHEDULE_REMINDER_PREFIX}${scheduleId}:snooze:${triggerDate.getTime()}`;

  if (useNativeAndroidReminders()) {
    await nativeScheduleReminder({
      identifier,
      title,
      body,
      scheduleId,
      triggerKey,
      triggerMs: triggerDate.getTime(),
    });
    return;
  }

  await scheduleNotificationAsync({
    identifier,
    content: {
      title,
      subtitle: 'Schedjun 日程',
      body,
      sound: Platform.OS === 'ios' ? 'default' : true,
      priority: AndroidNotificationPriority.MAX,
      vibrate: [0, 280, 160, 280],
      data: {
        type: 'schedule_reminder',
        scheduleId,
        triggerKey,
        triggerMs: String(triggerDate.getTime()),
      },
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'active' as const } : {}),
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}
