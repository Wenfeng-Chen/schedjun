export type RepeatPresetId = 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type RepeatFrequency = 'day' | 'week' | 'month' | 'year';

export type MonthRepeatMode = 'date' | 'weekday';

export interface CustomRepeatConfig {
  frequency: RepeatFrequency;
  interval: number;
  weekdays: number[];
  monthDays: number[];
  monthMode: MonthRepeatMode;
  yearMonths: number[];
}

export interface RepeatRule {
  preset: RepeatPresetId;
  custom?: CustomRepeatConfig;
}

export const REPEAT_PRESETS: { id: Exclude<RepeatPresetId, 'custom'>; label: string }[] = [
  { id: 'never', label: '永不' },
  { id: 'daily', label: '每天' },
  { id: 'weekly', label: '每周' },
  { id: 'monthly', label: '每月' },
  { id: 'yearly', label: '每年' },
];

export const FREQUENCY_OPTIONS: {
  value: RepeatFrequency;
  label: string;
  intervalTitle: string;
}[] = [
  { value: 'day', label: '天', intervalTitle: '每天' },
  { value: 'week', label: '周', intervalTitle: '每周' },
  { value: 'month', label: '月', intervalTitle: '每月' },
  { value: 'year', label: '年', intervalTitle: '每年' },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: '周一' },
  { value: 1, label: '周二' },
  { value: 2, label: '周三' },
  { value: 3, label: '周四' },
  { value: 4, label: '周五' },
  { value: 5, label: '周六' },
  { value: 6, label: '周日' },
];

export const DEFAULT_REPEAT_RULE: RepeatRule = { preset: 'never' };

export const MAX_REPEAT_INTERVAL = 99;
