/** 与界面 HH:mm 一致，秒和毫秒归零 */
export function floorToMinute(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  return result;
}

/** 解析后端 ISO 时间，按手机本地墙钟对齐到分钟 */
export function parseScheduleDateTime(iso: string): Date {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return floorToMinute(new Date());
  }
  return floorToMinute(parsed);
}
