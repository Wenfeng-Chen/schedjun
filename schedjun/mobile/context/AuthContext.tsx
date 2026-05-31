import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { loginApi, registerApi } from '../api/authApi';
import { setTokenRefreshHandler } from '../api/tokenRefresh';
import { getCurrentUserApi } from '../api/userApi';
import { colors } from '../constants/theme';
import { AuthCredentials, RegisterPayload, User } from '../constants/userTypes';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../storage/authStorage';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  login: (credentials: AuthCredentials) => Promise<string | null>;
  register: (payload: RegisterPayload) => Promise<string | null>;
  refreshCurrentUser: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(profile: {
  userId: string;
  username: string;
  timezone: string;
  createdAt: string;
}): User {
  return {
    id: profile.userId,
    username: profile.username,
    timezone: profile.timezone,
    createdAt: profile.createdAt,
  };
}

async function restoreSession(setUser: (user: User) => void) {
  const token = await getStoredAccessToken();
  if (!token) {
    return;
  }

  const profile = await getCurrentUserApi(token);
  setUser(toUser(profile));
}

async function applyAuthResult(
  accessToken: string,
  fallback: { userId: string; username: string },
  setUser: (user: User) => void,
  setAccessToken: (token: string) => void,
) {
  await setStoredAccessToken(accessToken);
  setAccessToken(accessToken);

  try {
    const profile = await getCurrentUserApi(accessToken);
    setUser(toUser(profile));
  } catch {
    setUser({ id: fallback.userId, username: fallback.username });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setTokenRefreshHandler(async (token) => {
      await setStoredAccessToken(token);
      if (!cancelled) {
        setAccessToken(token);
      }
    });

    (async () => {
      try {
        await restoreSession(setUser);
      } catch {
        await clearStoredAccessToken();
        if (!cancelled) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setTokenRefreshHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const trimmedUsername = credentials.username.trim();
    const password = credentials.password;

    if (!trimmedUsername || !password) {
      return '请输入用户名和密码';
    }

    try {
      const data = await loginApi(trimmedUsername, password);
      await applyAuthResult(
        data.accessToken,
        { userId: data.userId, username: trimmedUsername },
        setUser,
        setAccessToken,
      );
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
      await applyAuthResult(
        data.accessToken,
        { userId: data.userId, username: trimmedUsername },
        setUser,
        setAccessToken,
      );
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '注册失败';
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!accessToken) {
      return '未登录';
    }

    try {
      const profile = await getCurrentUserApi(accessToken);
      setUser(toUser(profile));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : '获取用户信息失败';
    }
  }, [accessToken]);

  const logout = useCallback(async () => {
    await clearStoredAccessToken();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoggedIn: user !== null,
      isBootstrapping,
      login,
      register,
      refreshCurrentUser,
      logout,
    }),
    [user, accessToken, isBootstrapping, login, register, refreshCurrentUser, logout],
  );

  if (isBootstrapping) {
    return (
      <View style={styles.bootstrapping}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  bootstrapping: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundWarm,
  },
});
