import { canScheduleExactAlarms } from 'expo-exact-alarms-permission';
import { Platform } from 'react-native';

/** Android 12+ 是否可使用精确闹钟（声明 USE_EXACT_ALARM 后安装即自动为 true） */
export function hasExactAlarmPermission(): boolean {
  return canScheduleExactAlarms();
}

/** 仅用于诊断日志，不弹窗打扰用户 */
export function logExactAlarmStatus(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  if (!hasExactAlarmPermission()) {
    console.warn(
      '[reminder] 精确闹钟未生效，请确认已重新安装 App（Manifest 需包含 USE_EXACT_ALARM）',
    );
  }
}
