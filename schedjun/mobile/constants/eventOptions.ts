export const REPEAT_OPTIONS = ['永不', '每天', '每周', '每月', '每年'] as const;
export type RepeatOption = (typeof REPEAT_OPTIONS)[number];

export const REMINDER_OPTIONS = [
  '无',
  '开始时',
  '5 分钟前',
  '15 分钟前',
  '30 分钟前',
  '1 小时前',
  '1 天前',
] as const;
export type ReminderOption = (typeof REMINDER_OPTIONS)[number];
