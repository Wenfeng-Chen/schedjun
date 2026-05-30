import { DEFAULT_REMINDER_RULE } from './reminderConfig';
import { DEFAULT_REPEAT_RULE } from './repeatConfig';
import { ScheduleItem } from './scheduleTypes';

function at(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    title: '赢派科技 Java 全栈实训',
    startTime: at(2026, 1, 6, 14, 0),
    endTime: at(2026, 1, 6, 15, 0),
    notes: '',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: { enabled: true, preset: 'min30' },
    allDay: false,
  },
  {
    id: '2',
    title: 'G2285-武汉站',
    startTime: at(2026, 1, 18, 14, 1),
    endTime: at(2026, 1, 18, 15, 1),
    notes: '',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: DEFAULT_REMINDER_RULE,
    allDay: false,
  },
  {
    id: '3',
    title: 'G2293-杭州站',
    startTime: at(2026, 1, 18, 19, 28),
    endTime: at(2026, 1, 18, 20, 43),
    notes: '',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: DEFAULT_REMINDER_RULE,
    allDay: false,
  },
  {
    id: '4',
    title: 'G5068-瑞金站',
    startTime: at(2026, 2, 27, 19, 24),
    endTime: at(2026, 2, 27, 20, 37),
    notes: '',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: DEFAULT_REMINDER_RULE,
    allDay: false,
  },
  {
    id: '5',
    title: 'D4520-南昌站',
    startTime: at(2026, 2, 27, 20, 43),
    endTime: at(2026, 2, 27, 22, 8),
    notes: '',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: DEFAULT_REMINDER_RULE,
    allDay: false,
  },
  {
    id: '6',
    title: '文华在线教育 Java 实习生 线下面试',
    startTime: at(2026, 3, 5, 15, 0),
    endTime: at(2026, 3, 5, 16, 0),
    notes:
      '候选人：\n面试职位：java 实习生，130-180元/天\n面试时间：2026-03-05 15:00\n打开 APP 查看更多：\nhttps://m.zhipin.com/schedule/interview',
    repeat: DEFAULT_REPEAT_RULE,
    reminder: { enabled: true, preset: 'custom', custom: { value: 1, unit: 'hour' } },
    allDay: false,
  },
];
