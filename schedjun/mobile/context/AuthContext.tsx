import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { AuthCredentials, RegisterPayload, User } from '../constants/userTypes';

interface StoredUser extends User {
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: (credentials: AuthCredentials) => string | null;
  register: (payload: RegisterPayload) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createUserId() {
  return `u_${Date.now().toString(36)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const usersRef = useRef<Map<string, StoredUser>>(new Map());

  const login = useCallback((credentials: AuthCredentials) => {
    const trimmedUsername = credentials.username.trim();
    const password = credentials.password;

    if (!trimmedUsername || !password) {
      return '请输入用户名和密码';
    }

    const stored = usersRef.current.get(trimmedUsername);
    if (!stored || stored.password !== password) {
      return '用户名或密码错误';
    }

    setUser({
      id: stored.id,
      username: stored.username,
      nickname: stored.nickname,
    });
    return null;
  }, []);

  const register = useCallback((payload: RegisterPayload) => {
    const trimmedUsername = payload.username.trim();
    const trimmedNickname = payload.nickname.trim();
    const password = payload.password;

    if (!trimmedUsername || !trimmedNickname || !password) {
      return '请填写完整信息';
    }

    if (password.length < 6) {
      return '密码至少 6 位';
    }

    if (password !== payload.confirmPassword) {
      return '两次密码不一致';
    }

    if (usersRef.current.has(trimmedUsername)) {
      return '用户名已被注册';
    }

    const newUser: StoredUser = {
      id: createUserId(),
      username: trimmedUsername,
      nickname: trimmedNickname,
      password,
    };

    usersRef.current.set(trimmedUsername, newUser);
    setUser({
      id: newUser.id,
      username: newUser.username,
      nickname: newUser.nickname,
    });
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
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
