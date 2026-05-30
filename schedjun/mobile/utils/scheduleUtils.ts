import { ScheduleItem } from '../constants/scheduleTypes';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export interface ScheduleDayGroup {
  key: string;
  date: Date;
  day: number;
  weekday: string;
  items: ScheduleItem[];
}

export interface ScheduleMonthSection {
  key: string;
  title: string;
  data: ScheduleDayGroup[];
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatScheduleTime(start: Date, end: Date): string {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (startLabel === endLabel) {
    return startLabel;
  }
  return `${startLabel}-${endLabel}`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthTitle(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function filterSchedules(items: ScheduleItem[], keyword: string): ScheduleItem[] {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    return items;
  }
  return items.filter((item) => item.title.toLowerCase().includes(trimmed));
}

export function groupSchedulesByMonth(items: ScheduleItem[]): ScheduleMonthSection[] {
  const sorted = [...items].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const monthMap = new Map<string, ScheduleMonthSection>();

  for (const item of sorted) {
    const date = new Date(
      item.startTime.getFullYear(),
      item.startTime.getMonth(),
      item.startTime.getDate(),
    );
    const mKey = monthKey(date);

    if (!monthMap.has(mKey)) {
      monthMap.set(mKey, {
        key: mKey,
        title: monthTitle(date),
        data: [],
      });
    }

    const section = monthMap.get(mKey)!;
    const dKey = dayKey(date);
    let dayGroup = section.data.find((group) => group.key === dKey);

    if (!dayGroup) {
      dayGroup = {
        key: dKey,
        date,
        day: date.getDate(),
        weekday: WEEKDAY_NAMES[date.getDay()],
        items: [],
      };
      section.data.push(dayGroup);
    }

    dayGroup.items.push(item);
  }

  return Array.from(monthMap.values()).sort(
    (a, b) => new Date(a.data[0].date).getTime() - new Date(b.data[0].date).getTime(),
  );
}
