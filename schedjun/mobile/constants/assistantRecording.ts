import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';

export const ASSISTANT_SAMPLE_RATE = 16000;

export const assistantRecordingOptions: RecordingOptions = {
  extension: '.wav',
  sampleRate: ASSISTANT_SAMPLE_RATE,
  numberOfChannels: 1,
  bitRate: ASSISTANT_SAMPLE_RATE * 16,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: ASSISTANT_SAMPLE_RATE,
  },
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MEDIUM,
    sampleRate: ASSISTANT_SAMPLE_RATE,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: ASSISTANT_SAMPLE_RATE * 16,
  },
};

export function createAssistantGroupId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `grp_${randomPart}${Date.now().toString(36)}`;
}

export function normalizeFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  return `file://${uri}`;
}

export type AssistantAudioFormat = 'wav' | 'pcm' | 'm4a';

export function inferAudioFormat(source: string): AssistantAudioFormat {
  const normalized = source.toLowerCase();
  if (normalized.endsWith('.pcm') || normalized.endsWith('.raw')) {
    return 'pcm';
  }
  if (normalized.endsWith('.m4a') || normalized.endsWith('.aac') || normalized.endsWith('.mp4')) {
    return 'm4a';
  }
  return 'wav';
}

export const MIN_AUDIO_BYTES = 3200;

export function audioMimeType(format: AssistantAudioFormat): string {
  if (format === 'pcm') {
    return 'audio/pcm';
  }
  if (format === 'm4a') {
    return 'audio/mp4';
  }
  return 'audio/wav';
}
