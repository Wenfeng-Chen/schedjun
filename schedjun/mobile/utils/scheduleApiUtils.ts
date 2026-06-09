import { EventFormData } from '../components/event/CreateEventScreen';
import { DEFAULT_REMINDER_RULE, ReminderRule } from '../constants/reminderConfig';
import { DEFAULT_REPEAT_RULE, RepeatRule } from '../constants/repeatConfig';
import { ScheduleItem } from '../constants/scheduleTypes';
import { floorToMinute, parseScheduleDateTime } from './dateTimeUtils';

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
  const normalized = floorToMinute(date);
  const timezoneOffsetMinutes = -normalized.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffsetMinutes) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffsetMinutes) % 60);

  return (
    `${normalized.getFullYear()}-${pad(normalized.getMonth() + 1)}-${pad(normalized.getDate())}` +
    `T${pad(normalized.getHours())}:${pad(normalized.getMinutes())}:00` +
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

export function eventFormToUpdatePayload(scheduleId: string, data: EventFormData) {
  return {
    id: scheduleId,
    ...eventFormToCreatePayload(data),
  };
}

export function scheduleVoToItem(vo: ScheduleResponseData): ScheduleItem {
  return {
    id: vo.id,
    title: vo.title,
    startTime: parseScheduleDateTime(vo.startTime),
    endTime: parseScheduleDateTime(vo.endTime),
    notes: vo.notes ?? '',
    repeat: vo.repeat ?? DEFAULT_REPEAT_RULE,
    reminder: vo.reminder ?? DEFAULT_REMINDER_RULE,
    allDay: false,
  };
}
