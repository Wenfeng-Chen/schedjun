import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 手动指定 API 地址时填写，例如 '192.168.1.100'
 * 留空则优先从 Expo 调试地址自动解析电脑 IP
 */
const MANUAL_API_HOST = '';

function parseHostFromDebugger(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const host = value.includes('://')
    ? value.split('://')[1]?.split(':')[0]
    : value.split(':')[0];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

function resolveDevHost(): string {
  if (MANUAL_API_HOST) {
    return MANUAL_API_HOST;
  }

  const expoConfig = Constants.expoConfig as { hostUri?: string } | null;
  const autoHost = parseHostFromDebugger(Constants.expoGoConfig?.debuggerHost)
    ?? parseHostFromDebugger(expoConfig?.hostUri);

  if (autoHost) {
    return autoHost;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

export const API_BASE_URL = `http://${resolveDevHost()}:8080/api/v1`;

if (__DEV__) {
  console.log('[api] API_BASE_URL =', API_BASE_URL);
}
