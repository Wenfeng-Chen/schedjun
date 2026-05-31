import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { loginApi, registerApi } from '../api/authApi';
import { AuthCredentials, RegisterPayload, User } from '../constants/userTypes';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (credentials: AuthCredentials) => Promise<string | null>;
  register: (payload: RegisterPayload) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthResult(
  data: { userId: string; accessToken: string },
  username: string,
  setUser: (user: User) => void,
  setAccessToken: (token: string) => void,
) {
  setUser({ id: data.userId, username });
  setAccessToken(data.accessToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const trimmedUsername = credentials.username.trim();
    const password = credentials.password;

    if (!trimmedUsername || !password) {
      return '请输入用户名和密码';
    }

    try {
      const data = await loginApi(trimmedUsername, password);
      applyAuthResult(data, trimmedUsername, setUser, setAccessToken);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '登录失败';
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const trimmedUsername = payload.username.trim();
    const password = payload.password;

    if (!trimmedUsername || !password) {
      return '请填写完整信息';
    }

    if (password.length < 6) {
      return '密码至少 6 位';
    }

    if (password !== payload.confirmPassword) {
      return '两次密码不一致';
    }

    try {
      const data = await registerApi(trimmedUsername, password);
      applyAuthResult(data, trimmedUsername, setUser, setAccessToken);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '注册失败';
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoggedIn: user !== null,
      login,
      register,
      logout,
    }),
    [user, accessToken, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
