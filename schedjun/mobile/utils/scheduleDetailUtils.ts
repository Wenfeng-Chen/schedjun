import { ScheduleItem } from '../constants/scheduleTypes';
import { isSameDay } from './calendarUtils';

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function getSchedulesForDate(schedules: ScheduleItem[], date: Date): ScheduleItem[] {
  return schedules
    .filter((item) => isSameDay(item.startTime, date))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function formatScheduleDetailSubtitle(item: ScheduleItem): string {
  const month = item.startTime.getMonth() + 1;
  const day = item.startTime.getDate();
  const weekday = WEEKDAY_NAMES[item.startTime.getDay()];

  if (item.allDay) {
    return `${month}月${day}日${weekday}`;
  }

  const hours = item.startTime.getHours().toString().padStart(2, '0');
  const minutes = item.startTime.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日${weekday}，${hours}:${minutes}`;
}

export function scheduleToFormData(item: ScheduleItem) {
  return {
    title: item.title,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
    repeat: item.repeat,
    reminder: item.reminder,
    notes: item.notes,
    allDay: item.allDay,
  };
}

export function formDataToSchedule(id: string, data: ReturnType<typeof scheduleToFormData>): ScheduleItem {
  return {
    id,
    title: data.title,
    startTime: data.startTime,
    endTime: data.endTime,
    notes: data.notes,
    repeat: data.repeat,
    reminder: data.reminder,
    allDay: data.allDay,
  };
}
