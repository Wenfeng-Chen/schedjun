import { File, UploadType } from 'expo-file-system';

import { API_BASE_URL } from '../constants/apiConfig';
import { ReminderRule } from '../constants/reminderConfig';
import { RepeatRule } from '../constants/repeatConfig';
import { formatOffsetDateTime } from '../utils/scheduleApiUtils';
import {
  ASSISTANT_SAMPLE_RATE,
  audioMimeType,
  inferAudioFormat,
  MIN_AUDIO_BYTES,
  normalizeFileUri,
} from '../constants/assistantRecording';
import { ApiResult, postJsonWithToken, unwrapResult } from './apiClient';
import { applyRefreshedTokenFromHeaders } from './tokenRefresh';
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

export interface VoiceToScheduleParams {
  groupId: string;
  audioUri: string;
  timezone?: string;
  autoConfirm?: boolean;
}

export async function voiceToScheduleApi(
  accessToken: string,
  params: VoiceToScheduleParams,
): Promise<VoiceToScheduleData> {
  const file = new File(normalizeFileUri(params.audioUri));
  const formatSource = file.extension || file.name || params.audioUri;
  const format = inferAudioFormat(formatSource);

  if (file.size != null && file.size > 0 && file.size < MIN_AUDIO_BYTES) {
    throw new Error('录音太短，请按住麦克风多说几句');
  }

  const uploadResult = await file.upload(`${API_BASE_URL}/assistant/voice-to-schedule`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'audio',
    mimeType: audioMimeType(format),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    parameters: {
      groupId: params.groupId,
      format,
      sampleRate: String(ASSISTANT_SAMPLE_RATE),
      timezone: params.timezone ?? 'Asia/Shanghai',
      currentTime: formatOffsetDateTime(new Date()),
      autoConfirm: String(Boolean(params.autoConfirm)),
    },
  });

  await applyRefreshedTokenFromHeaders(uploadResult.headers);

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`网络错误 (${uploadResult.status})`);
  }

  let parsed: ApiResult<VoiceToScheduleData>;
  try {
    parsed = JSON.parse(uploadResult.body) as ApiResult<VoiceToScheduleData>;
  } catch {
    throw new Error('响应解析失败');
  }

  return unwrapResult(parsed);
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
