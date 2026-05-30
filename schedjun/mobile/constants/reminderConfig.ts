export type ReminderPresetId =
  | 'none'
  | 'atStart'
  | 'min5'
  | 'min10'
  | 'min15'
  | 'min30'
  | 'custom';

export type ReminderTimeUnit = 'minute' | 'hour' | 'day';

export interface CustomReminderConfig {
  value: number;
  unit: ReminderTimeUnit;
}

export interface ReminderRule {
  enabled: boolean;
  preset: ReminderPresetId;
  custom?: CustomReminderConfig;
}

export const REMINDER_PRESETS: {
  id: Exclude<ReminderPresetId, 'none' | 'custom'>;
  label: string;
}[] = [
  { id: 'atStart', label: '开始时' },
  { id: 'min5', label: '5 分钟前' },
  { id: 'min10', label: '10 分钟前' },
  { id: 'min15', label: '15 分钟前' },
  { id: 'min30', label: '30 分钟前' },
];

export const REMINDER_TIME_UNITS: { value: ReminderTimeUnit; label: string }[] = [
  { value: 'minute', label: '分钟' },
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
];

export const DEFAULT_REMINDER_RULE: ReminderRule = {
  enabled: true,
  preset: 'atStart',
};

export const MAX_REMINDER_VALUE = 59;
