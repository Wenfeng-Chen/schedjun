import { NativeModules, Platform } from 'react-native';

interface ScheduleReminderNativeModule {
  scheduleReminder(
    identifier: string,
    title: string,
    body: string,
    scheduleId: string,
    triggerKey: string,
    triggerMs: number,
  ): Promise<void>;
  cancelReminder(identifier: string): Promise<void>;
  cancelOrphanReminders(activeScheduleIds: string[]): Promise<void>;
}

const NativeScheduleReminder = NativeModules.ScheduleReminderModule as
  | ScheduleReminderNativeModule
  | undefined;

export function isNativeScheduleReminderAvailable(): boolean {
  return Platform.OS === 'android' && NativeScheduleReminder != null;
}

export async function nativeScheduleReminder(input: {
  identifier: string;
  title: string;
  body: string;
  scheduleId: string;
  triggerKey: string;
  triggerMs: number;
}): Promise<void> {
  if (!NativeScheduleReminder) {
    throw new Error('ScheduleReminderModule unavailable');
  }
  await NativeScheduleReminder.scheduleReminder(
    input.identifier,
    input.title,
    input.body,
    input.scheduleId,
    input.triggerKey,
    input.triggerMs,
  );
}

export async function nativeCancelReminder(identifier: string): Promise<void> {
  if (!NativeScheduleReminder) {
    return;
  }
  await NativeScheduleReminder.cancelReminder(identifier);
}

export async function nativeCancelOrphanReminders(activeScheduleIds: string[]): Promise<void> {
  if (!NativeScheduleReminder) {
    return;
  }
  await NativeScheduleReminder.cancelOrphanReminders(activeScheduleIds);
}
