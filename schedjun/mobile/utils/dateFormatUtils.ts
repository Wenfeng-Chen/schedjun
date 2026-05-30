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

export function createDefaultEventTimes(baseDate: Date): { start: Date; end: Date } {
  const start = new Date(baseDate);
  start.setHours(10, 30, 0, 0);

  const end = new Date(baseDate);
  end.setHours(11, 30, 0, 0);

  return { start, end };
}
