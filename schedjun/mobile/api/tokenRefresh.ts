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
