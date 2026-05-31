import { postJson, unwrapResult, type ApiResult } from './apiClient';

export type { ApiResult };

export interface AuthResponseData {
  userId: string;
  accessToken: string;
  expiresIn: number;
}

export async function registerApi(username: string, password: string): Promise<AuthResponseData> {
  const result = await postJson<AuthResponseData>('/auth/register', { username, password });
  return unwrapResult(result);
}

export async function loginApi(username: string, password: string): Promise<AuthResponseData> {
  const result = await postJson<AuthResponseData>('/auth/login', { username, password });
  return unwrapResult(result);
}
