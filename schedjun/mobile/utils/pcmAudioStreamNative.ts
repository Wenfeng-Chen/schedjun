import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

interface PcmAudioStreamNativeModule {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const NativePcmAudioStream = NativeModules.PcmAudioStreamModule as
  | PcmAudioStreamNativeModule
  | undefined;

const EVENT_PCM_CHUNK = 'onPcmChunk';

export function isPcmAudioStreamAvailable(): boolean {
  return Platform.OS === 'android' && NativePcmAudioStream != null;
}

export async function startPcmAudioStream(): Promise<void> {
  if (!NativePcmAudioStream) {
    throw new Error('PcmAudioStreamModule unavailable');
  }
  await NativePcmAudioStream.start();
}

export async function stopPcmAudioStream(): Promise<void> {
  if (!NativePcmAudioStream) {
    return;
  }
  await NativePcmAudioStream.stop();
}

export function subscribePcmChunks(onChunk: (base64: string) => void): () => void {
  if (!NativePcmAudioStream) {
    return () => undefined;
  }

  const emitter = new NativeEventEmitter(NativePcmAudioStream);
  const subscription = emitter.addListener(EVENT_PCM_CHUNK, onChunk);
  return () => subscription.remove();
}
