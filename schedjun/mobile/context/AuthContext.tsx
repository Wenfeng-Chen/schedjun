import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { registerApi } from '../api/authApi';
import { AuthCredentials, RegisterPayload, User } from '../constants/userTypes';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (credentials: AuthCredentials) => string | null;
  register: (payload: RegisterPayload) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useCallback((credentials: AuthCredentials) => {
    return '登录功能暂未开放，请先测试注册';
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
      setUser({
        id: data.userId,
        username: trimmedUsername,
      });
      setAccessToken(data.accessToken);
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
