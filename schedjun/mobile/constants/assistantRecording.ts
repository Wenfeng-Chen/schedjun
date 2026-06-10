export function createAssistantGroupId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `grp_${randomPart}${Date.now().toString(36)}`;
}

/** 按住说话最短时长（毫秒） */
export const MIN_HOLD_MS = 1200;
