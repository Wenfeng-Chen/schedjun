const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function formatEventDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}年${month}月${day}日${weekday} ${hours}:${minutes}`;
}

export function formatPickerDateLabel(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_NAMES[date.getDay()]}`;
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildDateTime(datePart: Date, hour: number, minute: number): Date {
  const result = new Date(datePart);
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function generateDateOptions(anchor: Date, daysBefore = 30, daysAfter = 365): Date[] {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysBefore);

  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function findDateOptionIndex(options: Date[], target: Date): number {
  const index = options.findIndex((item) => isSameDate(item, target));
  return index >= 0 ? index : 0;
}

export function createDefaultEventTimes(baseDate: Date): { start: Date; end: Date } {
  const start = new Date(baseDate);
  start.setHours(10, 30, 0, 0);

  const end = new Date(baseDate);
  end.setHours(11, 30, 0, 0);

  return { start, end };
}
