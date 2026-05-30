const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export const DATE_JUMP_YEAR_START = 1900;
export const DATE_JUMP_YEAR_END = 2100;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildJumpDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatJumpDatePreview(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${WEEKDAY_NAMES[date.getDay()]}`;
}

export function generateYearOptions(
  start = DATE_JUMP_YEAR_START,
  end = DATE_JUMP_YEAR_END,
): string[] {
  return Array.from({ length: end - start + 1 }, (_, index) => `${start + index}`);
}

export function generateMonthOptions(): string[] {
  return Array.from({ length: 12 }, (_, index) => (index + 1).toString().padStart(2, '0'));
}

export function generateDayOptions(year: number, month: number): string[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => (index + 1).toString().padStart(2, '0'));
}

export function clampDayForMonth(year: number, month: number, day: number): number {
  return Math.min(day, getDaysInMonth(year, month));
}
