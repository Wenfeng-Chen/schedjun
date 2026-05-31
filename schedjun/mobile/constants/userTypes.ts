export interface User {
  id: string;
  username: string;
  nickname: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  nickname: string;
  confirmPassword: string;
}
