import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * 真机连不上时，填电脑局域网 IP，例如 '192.168.1.100'
 * 留空则优先从 Expo 调试地址自动解析
 */
// 填电脑在 WiFi/局域网上的 IPv4（ipconfig 里非 172.x 虚拟网卡那条），手机才能连上
const MANUAL_API_HOST = '10.15.2.181';

function parseHostFromDebugger(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const withoutScheme = value.includes('://') ? value.split('://')[1] : value;
  const host = withoutScheme?.split(':')[0]?.split('/')[0];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

function getExpoDevHost(): string | null {
  const legacyManifest = Constants.manifest as { debuggerHost?: string } | null;
  const sources = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    legacyManifest?.debuggerHost,
  ];

  for (const source of sources) {
    const host = parseHostFromDebugger(source);
    if (host) {
      return host;
    }
  }

  return null;
}

function resolveDevHost(): string {
  if (MANUAL_API_HOST) {
    return MANUAL_API_HOST;
  }

  const autoHost = getExpoDevHost();
  if (autoHost) {
    return autoHost;
  }

  // 仅 Android 模拟器使用 10.0.2.2 访问宿主机
  if (Platform.OS === 'android' && !Device.isDevice) {
    return '10.0.2.2';
  }

  return 'localhost';
}

export const API_BASE_URL = `http://${resolveDevHost()}:8080/api/v1`;

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const ASSISTANT_ASR_STREAM_URL = `${WS_BASE_URL}/assistant/asr-stream`;

export function getApiConnectionHint(): string {
  if (Device.isDevice && !MANUAL_API_HOST && !getExpoDevHost()) {
    return '请在 constants/apiConfig.ts 中设置 MANUAL_API_HOST 为电脑局域网 IP';
  }
  return '请确认后端已启动，且手机与电脑在同一 WiFi';
}

if (__DEV__) {
  console.log('[api] API_BASE_URL =', API_BASE_URL);
  console.log('[api] isDevice =', Device.isDevice);
}
