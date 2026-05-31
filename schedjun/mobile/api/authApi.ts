import { API_BASE_URL } from '../constants/apiConfig';

export interface ApiResult<T> {
  code: number;
  msg: string | null;
  data: T | null;
}

export interface AuthResponseData {
  userId: string;
  accessToken: string;
  expiresIn: number;
}

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('无法连接服务器，请确认后端已启动且手机与电脑在同一网络');
  }

  if (!response.ok) {
    throw new Error(`网络错误 (${response.status})`);
  }

  return response.json() as Promise<ApiResult<T>>;
}

function unwrapResult<T>(result: ApiResult<T>): T {
  if (result.code !== 1 || !result.data) {
    throw new Error(result.msg ?? '请求失败');
  }
  return result.data;
}

export async function registerApi(username: string, password: string): Promise<AuthResponseData> {
  const result = await postJson<AuthResponseData>('/auth/register', { username, password });
  return unwrapResult(result);
}
