export interface User {
  id: string;
  username: string;
  timezone?: string;
  createdAt?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  confirmPassword: string;
}

export function formatUserCreatedAt(createdAt?: string): string | null {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
