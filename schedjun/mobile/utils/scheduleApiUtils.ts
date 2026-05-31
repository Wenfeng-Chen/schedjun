import { EventFormData } from '../components/event/CreateEventScreen';
import { ReminderRule } from '../constants/reminderConfig';
import { RepeatRule } from '../constants/repeatConfig';
import { ScheduleItem } from '../constants/scheduleTypes';

export interface ScheduleResponseData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  notes: string;
  repeat: RepeatRule;
  reminder: ReminderRule;
  source: string;
  createdAt: string;
  updatedAt: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatOffsetDateTime(date: Date): string {
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffsetMinutes) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffsetMinutes) % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offsetHours}:${offsetMinutes}`
  );
}

export function eventFormToCreatePayload(data: EventFormData) {
  return {
    title: data.title,
    startTime: formatOffsetDateTime(data.startTime),
    endTime: formatOffsetDateTime(data.endTime),
    notes: data.notes,
    allDay: false,
    repeat: data.repeat,
    reminder: data.reminder,
  };
}

export function scheduleVoToItem(vo: ScheduleResponseData): ScheduleItem {
  return {
    id: vo.id,
    title: vo.title,
    startTime: new Date(vo.startTime),
    endTime: new Date(vo.endTime),
    notes: vo.notes ?? '',
    repeat: vo.repeat,
    reminder: vo.reminder,
    allDay: false,
  };
}
