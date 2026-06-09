import {
  CustomReminderConfig,
  DEFAULT_REMINDER_RULE,
  REMINDER_PRESETS,
  REMINDER_TIME_UNITS,
  ReminderRule,
  ReminderTimeUnit,
} from '../constants/reminderConfig';
import { floorToMinute } from './dateTimeUtils';

export function createDefaultCustomReminder(): CustomReminderConfig {
  return { value: 3, unit: 'hour' };
}

export function getReminderUnitLabel(unit: ReminderTimeUnit): string {
  return REMINDER_TIME_UNITS.find((item) => item.value === unit)?.label ?? '分钟';
}

export function formatCustomReminderLabel(custom: CustomReminderConfig): string {
  const unit = getReminderUnitLabel(custom.unit);
  return `${custom.value} ${unit}前`;
}

export function formatReminderLabel(rule: ReminderRule): string {
  if (!rule.enabled || rule.preset === 'none') {
    return '无';
  }

  if (rule.preset === 'custom' && rule.custom) {
    return formatCustomReminderLabel(rule.custom);
  }

  const preset = REMINDER_PRESETS.find((item) => item.id === rule.preset);
  return preset?.label ?? '开始时';
}

/** 提醒相对开始时间的提前毫秒数；无提醒时返回 null */
export function getReminderOffsetMs(rule: ReminderRule | null | undefined): number | null {
  if (!rule || !rule.enabled || rule.preset === 'none') {
    return null;
  }

  switch (rule.preset) {
    case 'atStart':
      return 0;
    case 'min5':
      return 5 * 60 * 1000;
    case 'min10':
      return 10 * 60 * 1000;
    case 'min15':
      return 15 * 60 * 1000;
    case 'min30':
      return 30 * 60 * 1000;
    case 'custom': {
      if (!rule.custom) {
        return null;
      }
      const { value, unit } = rule.custom;
      if (unit === 'minute') {
        return value * 60 * 1000;
      }
      if (unit === 'hour') {
        return value * 60 * 60 * 1000;
      }
      if (unit === 'day') {
        return value * 24 * 60 * 60 * 1000;
      }
      return null;
    }
    default:
      return 0;
  }
}

/** 提醒触发的绝对时间戳（毫秒），与界面 HH:mm 对齐 */
export function getReminderTriggerTimestamp(startTime: Date, rule: ReminderRule): number | null {
  const offsetMs = getReminderOffsetMs(rule);
  if (offsetMs === null) {
    return null;
  }

  return floorToMinute(startTime).getTime() - offsetMs;
}

/** 用于同步去重：同一日程、同一触发时刻只注册一次系统通知 */
export function buildReminderTriggerKey(scheduleId: string, triggerMs: number): string {
  return `${scheduleId}:${triggerMs}`;
}

/**
 * 计算系统通知的触发时刻。
 * - 未来：准点 DATE 触发
 * - 刚过点 90 秒内：补发 1 秒后（避免 sync 略晚导致漏提醒）
 * - 过期超过 90 秒：不再调度
 */
export function resolveReminderTriggerDate(startTime: Date, rule: ReminderRule): Date | null {
  const triggerMs = getReminderTriggerTimestamp(startTime, rule);
  if (triggerMs === null) {
    return null;
  }

  const now = Date.now();
  const lateByMs = now - triggerMs;

  if (lateByMs > 90_000) {
    return null;
  }

  if (lateByMs >= 0) {
    return new Date(now + 1_000);
  }

  return new Date(triggerMs);
}

export function buildReminderNotificationBody(title: string, rule: ReminderRule): string {
  if (!rule.enabled || rule.preset === 'none') {
    return title;
  }

  if (rule.preset === 'atStart') {
    return `「${title}」现在开始`;
  }

  if (rule.preset === 'custom' && rule.custom) {
    return `「${title}」${formatCustomReminderLabel(rule.custom)}`;
  }

  const preset = REMINDER_PRESETS.find((item) => item.id === rule.preset);
  const label = preset?.label ?? '开始时';
  return `「${title}」${label}`;
}

export function normalizeReminderRule(rule: ReminderRule): ReminderRule {
  if (!rule.enabled) {
    return { ...DEFAULT_REMINDER_RULE, enabled: false, preset: 'none' };
  }

  if (rule.preset === 'custom') {
    return {
      enabled: true,
      preset: 'custom',
      custom: rule.custom ?? createDefaultCustomReminder(),
    };
  }

  return { enabled: true, preset: rule.preset };
}
