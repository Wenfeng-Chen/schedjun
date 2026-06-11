import { EventFormData } from '../components/event/CreateEventScreen';
import { getJsonWithToken, postJsonWithToken, putJsonWithToken, deleteJsonWithToken, unwrapResult } from './apiClient';
import {
  eventFormToCreatePayload,
  eventFormToUpdatePayload,
  ScheduleResponseData,
} from '../utils/scheduleApiUtils';

export interface ScheduleScrollData {
  records: ScheduleResponseData[];
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
}

export interface ScheduleListParams {
  startDate?: string;
  endDate?: string;
  keyword?: string;
  cursor?: string;
  limit?: number;
}

export async function createScheduleApi(
  accessToken: string,
  data: EventFormData,
): Promise<ScheduleResponseData> {
  const result = await postJsonWithToken<ScheduleResponseData>(
    '/schedules',
    eventFormToCreatePayload(data),
    accessToken,
  );
  return unwrapResult(result);
}

export async function updateScheduleApi(
  accessToken: string,
  scheduleId: string,
  data: EventFormData,
): Promise<ScheduleResponseData> {
  const result = await putJsonWithToken<ScheduleResponseData>(
    '/schedules',
    eventFormToUpdatePayload(scheduleId, data),
    accessToken,
  );
  return unwrapResult(result);
}

export interface ScheduleDeleteData {
  deletedCount: number;
  scheduleIds: string[];
}

export async function deleteSchedulesApi(
  accessToken: string,
  scheduleIds: string[],
): Promise<ScheduleDeleteData> {
  const result = await deleteJsonWithToken<ScheduleDeleteData>(
    '/schedules',
    accessToken,
    { scheduleIds },
  );
  return unwrapResult(result);
}

export async function listSchedulesApi(
  accessToken: string,
  params: ScheduleListParams = {},
): Promise<ScheduleScrollData> {
  const result = await getJsonWithToken<ScheduleScrollData>('/schedules', accessToken, {
    startDate: params.startDate,
    endDate: params.endDate,
    keyword: params.keyword,
    cursor: params.cursor,
    limit: params.limit ?? 20,
  });
  return unwrapResult(result);
}
