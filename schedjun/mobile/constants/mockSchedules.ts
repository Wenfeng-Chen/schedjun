import { ScheduleItem } from './scheduleTypes';

function at(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    title: '赢派科技 Java 全栈实训',
    startTime: at(2026, 1, 6, 14, 0),
    endTime: at(2026, 1, 6, 14, 0),
  },
  {
    id: '2',
    title: 'G2285-武汉站',
    startTime: at(2026, 1, 18, 14, 1),
    endTime: at(2026, 1, 18, 15, 1),
  },
  {
    id: '3',
    title: 'G2293-杭州站',
    startTime: at(2026, 1, 18, 19, 28),
    endTime: at(2026, 1, 18, 20, 43),
  },
  {
    id: '4',
    title: 'G5068-瑞金站',
    startTime: at(2026, 2, 27, 19, 24),
    endTime: at(2026, 2, 27, 20, 37),
  },
  {
    id: '5',
    title: 'D4520-南昌站',
    startTime: at(2026, 2, 27, 20, 43),
    endTime: at(2026, 2, 27, 22, 8),
  },
  {
    id: '6',
    title: '星创 Java 实训',
    startTime: at(2026, 3, 5, 9, 0),
    endTime: at(2026, 3, 5, 9, 0),
  },
];
