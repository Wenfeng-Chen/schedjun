import { API_BASE_URL, getApiConnectionHint } from '../constants/apiConfig';
import { applyRefreshedToken } from './tokenRefresh';

export interface ApiResult<T> {
  code: number;
  msg: string | null;
  data: T | null;
}

export function unwrapResult<T>(result: ApiResult<T>): T {
  if (result.code !== 1 || !result.data) {
    throw new Error(result.msg ?? '请求失败');
  }
  return result.data;
}

async function requestJson<T>(
  path: string,
  options: RequestInit & { token?: string },
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  // FormData 必须由 fetch 自动带 multipart boundary，不能设 application/json
  if (options.body && !headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error('[api] request failed:', API_BASE_URL, error);
    if (error instanceof Error && error.message.includes('FormData')) {
      throw error;
    }
    throw new Error(`无法连接服务器（${API_BASE_URL}）。${getApiConnectionHint()}`);
  }

  await applyRefreshedToken(response);

  if (!response.ok) {
    throw new Error(`网络错误 (${response.status})`);
  }

  return response.json() as Promise<ApiResult<T>>;
}

export async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postJsonWithToken<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function postMultipartWithToken<T>(
  path: string,
  formData: FormData,
  token: string,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'POST',
    body: formData,
    token,
  });
}

export async function putJsonWithToken<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export async function deleteJsonWithToken<T>(
  path: string,
  token: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'DELETE',
    token,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function getJson<T>(path: string, token: string): Promise<ApiResult<T>> {
  return requestJson<T>(path, {
    method: 'GET',
    token,
  });
}

function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getJsonWithToken<T>(
  path: string,
  token: string,
  params?: Record<string, string | number | undefined | null>,
): Promise<ApiResult<T>> {
  const query = params ? buildQueryString(params) : '';
  return requestJson<T>(`${path}${query}`, {
    method: 'GET',
    token,
  });
}
