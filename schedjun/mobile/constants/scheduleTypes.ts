import { ReminderRule } from './reminderConfig';
import { RepeatRule } from './repeatConfig';

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  notes: string;
  repeat: RepeatRule;
  reminder: ReminderRule;
  allDay: boolean;
}
