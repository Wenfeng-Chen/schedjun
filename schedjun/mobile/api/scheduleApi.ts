import { EventFormData } from '../components/event/CreateEventScreen';
import { postJsonWithToken, unwrapResult } from './apiClient';
import {
  eventFormToCreatePayload,
  ScheduleResponseData,
} from '../utils/scheduleApiUtils';

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
