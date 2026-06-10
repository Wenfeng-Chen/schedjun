import { formatOffsetDateTime } from '../utils/scheduleApiUtils';
import { ApiResult, postJsonWithToken, unwrapResult } from './apiClient';
import { ReminderRule } from '../constants/reminderConfig';
import { RepeatRule } from '../constants/repeatConfig';
import { ScheduleResponseData } from '../utils/scheduleApiUtils';

export interface ScheduleDraft {
  scheduleId?: string;
  title: string;
  startTime: string;
  endTime: string;
  notes?: string;
  allDay?: boolean;
  repeat: RepeatRule;
  reminder: ReminderRule;
}

export interface VoiceToScheduleData {
  groupId: string;
  asrText: string;
  reply: string;
  intent: string;
  scheduleDraft: ScheduleDraft | null;
  schedule: ScheduleResponseData | null;
  needConfirm: boolean;
  messageId: string;
}

export interface AssistantConfirmData {
  reply: string;
  schedule: ScheduleResponseData | null;
}

export interface TextToScheduleParams {
  groupId: string;
  text: string;
  timezone?: string;
  autoConfirm?: boolean;
}

export async function textToScheduleApi(
  accessToken: string,
  params: TextToScheduleParams,
): Promise<VoiceToScheduleData> {
  const result = await postJsonWithToken<VoiceToScheduleData>(
    '/assistant/text-to-schedule',
    {
      groupId: params.groupId,
      text: params.text,
      timezone: params.timezone ?? 'Asia/Shanghai',
      currentTime: formatOffsetDateTime(new Date()),
      autoConfirm: Boolean(params.autoConfirm),
    },
    accessToken,
  );
  return unwrapResult(result);
}

export interface AssistantConfirmParams {
  groupId: string;
  messageId: string;
  action: 'confirm' | 'cancel';
  scheduleDraft?: ScheduleDraft;
}

export async function confirmAssistantApi(
  accessToken: string,
  params: AssistantConfirmParams,
): Promise<AssistantConfirmData> {
  const result = await postJsonWithToken<AssistantConfirmData>(
    '/assistant/confirm',
    params,
    accessToken,
  );
  return unwrapResult(result);
}
