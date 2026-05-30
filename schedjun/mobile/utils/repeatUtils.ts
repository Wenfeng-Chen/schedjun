import {
  CustomRepeatConfig,
  FREQUENCY_OPTIONS,
  RepeatPresetId,
  RepeatRule,
  WEEKDAY_OPTIONS,
} from '../constants/repeatConfig';

export function getWeekdayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function createDefaultCustomRepeat(startTime: Date): CustomRepeatConfig {
  return {
    frequency: 'day',
    interval: 1,
    weekdays: [getWeekdayIndex(startTime)],
    monthDays: [startTime.getDate()],
    monthMode: 'date',
    yearMonths: [startTime.getMonth() + 1],
  };
}

export function getFrequencyLabel(frequency: CustomRepeatConfig['frequency']): string {
  return FREQUENCY_OPTIONS.find((item) => item.value === frequency)?.label ?? '天';
}

export function getIntervalTitle(frequency: CustomRepeatConfig['frequency']): string {
  return FREQUENCY_OPTIONS.find((item) => item.value === frequency)?.intervalTitle ?? '每天';
}

export function formatWeekdays(weekdays: number[]): string {
  return weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_OPTIONS.find((item) => item.value === day)?.label ?? '')
    .filter(Boolean)
    .join('、');
}

export function formatRepeatLabel(rule: RepeatRule): string {
  if (rule.preset === 'custom' && rule.custom) {
    return formatCustomRepeatShort(rule.custom);
  }

  const presetLabels: Record<Exclude<RepeatPresetId, 'custom'>, string> = {
    never: '永不',
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };

  return presetLabels[rule.preset as Exclude<RepeatPresetId, 'custom'>] ?? '永不';
}

function formatCustomRepeatShort(custom: CustomRepeatConfig): string {
  const unit = getFrequencyLabel(custom.frequency);
  if (custom.interval === 1) {
    return `每${unit}`;
  }
  return `每${custom.interval}${unit}`;
}

export function formatRepeatSummary(rule: RepeatRule, startTime: Date): string {
  if (rule.preset !== 'custom' || !rule.custom) {
    const label = formatRepeatLabel(rule);
    return label === '永不' ? '事件不会重复' : `事件将会${label}重复提醒`;
  }

  return formatCustomRepeatSummary(rule.custom, startTime);
}

export function formatCustomRepeatSummary(custom: CustomRepeatConfig, startTime: Date): string {
  const { frequency, interval } = custom;
  const everyText =
    interval === 1
      ? `每${getFrequencyLabel(frequency)}`
      : `每${interval}${getFrequencyLabel(frequency)}`;

  switch (frequency) {
    case 'day':
      return `事件将会${everyText}重复提醒`;
    case 'week': {
      const days = formatWeekdays(custom.weekdays);
      return days
        ? `事件将会${everyText}的${days}重复提醒`
        : `事件将会${everyText}重复提醒`;
    }
    case 'month': {
      if (custom.monthMode === 'weekday') {
        const days = formatWeekdays(custom.weekdays);
        return days
          ? `事件将会${everyText}的${days}重复提醒`
          : `事件将会${everyText}重复提醒`;
      }
      const dates = custom.monthDays.slice().sort((a, b) => a - b).join('、');
      return dates
        ? `事件将会${everyText}的${dates}日重复提醒`
        : `事件将会${everyText}重复提醒`;
    }
    case 'year': {
      const months = custom.yearMonths
        .slice()
        .sort((a, b) => a - b)
        .map((month) => `${month}月`)
        .join('、');
      const day = startTime.getDate();
      return months
        ? `事件将会${everyText}的${months}${day}日重复提醒`
        : `事件将会${everyText}重复提醒`;
    }
    default:
      return `事件将会${everyText}重复提醒`;
  }
}
