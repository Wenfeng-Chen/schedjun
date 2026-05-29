export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export interface MonthRef {
  year: number;
  month: number;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export function createMonthRef(date: Date): MonthRef {
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function isSameMonthRef(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month === b.month;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(ref: MonthRef, offset: number): MonthRef {
  const date = new Date(ref.year, ref.month + offset, 1);
  return createMonthRef(date);
}

export function monthDiff(from: MonthRef, to: MonthRef): number {
  return (from.year - to.year) * 12 + (from.month - to.month);
}

export function generateMonthRange(center: MonthRef, total: number): MonthRef[] {
  const half = Math.floor(total / 2);
  return Array.from({ length: total }, (_, index) => addMonths(center, index - half));
}

export function getMonthLabel(ref: MonthRef): string {
  return `${ref.month + 1}月`;
}

export function getMonthTitle(ref: MonthRef, today: Date): string {
  if (ref.year === today.getFullYear()) {
    return getMonthLabel(ref);
  }
  return `${ref.year}年${ref.month + 1}月`;
}

export function buildCalendarDays(ref: MonthRef, today: Date): CalendarDay[] {
  const firstDay = new Date(ref.year, ref.month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(ref.year, ref.month, 1 - startOffset + index);
    const weekday = date.getDay();

    return {
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === ref.month,
      isToday: isSameDay(date, today),
      isWeekend: weekday === 0 || weekday === 6,
    };
  });
}

export function formatDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function formatSelectedDate(date: Date) {
  return {
    main: `${date.getMonth() + 1}月${date.getDate()}日`,
    year: `${date.getFullYear()}年`,
    weekday: WEEKDAY_NAMES[date.getDay()],
  };
}
