import {
  CustomReminderConfig,
  DEFAULT_REMINDER_RULE,
  REMINDER_PRESETS,
  REMINDER_TIME_UNITS,
  ReminderRule,
  ReminderTimeUnit,
} from '../constants/reminderConfig';

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
