export const REFRESHED_TOKEN_HEADER = 'X-Access-Token';

type TokenRefreshHandler = (token: string) => void | Promise<void>;

let tokenRefreshHandler: TokenRefreshHandler | null = null;

export function setTokenRefreshHandler(handler: TokenRefreshHandler | null) {
  tokenRefreshHandler = handler;
}

export async function applyRefreshedToken(response: Response) {
  const refreshedToken = response.headers.get(REFRESHED_TOKEN_HEADER);
  if (!refreshedToken || !tokenRefreshHandler) {
    return;
  }

  await tokenRefreshHandler(refreshedToken);
}

export async function applyRefreshedTokenFromHeaders(headers: Record<string, string>) {
  const refreshedToken =
    headers[REFRESHED_TOKEN_HEADER] ??
    headers[REFRESHED_TOKEN_HEADER.toLowerCase()];
  if (!refreshedToken || !tokenRefreshHandler) {
    return;
  }

  await tokenRefreshHandler(refreshedToken);
}
