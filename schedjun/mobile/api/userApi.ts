import { getJson, unwrapResult } from './apiClient';

export interface CurrentUserData {
  userId: string;
  username: string;
  timezone: string;
  createdAt: string;
}

export async function getCurrentUserApi(accessToken: string): Promise<CurrentUserData> {
  const result = await getJson<CurrentUserData>('/users/me', accessToken);
  return unwrapResult(result);
}
