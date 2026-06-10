import { Ionicons } from '@expo/vector-icons';
import { AudioModule, setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  confirmAssistantApi,
  textToScheduleApi,
  type ScheduleDraft,
} from '../../api/assistantApi';
import {
  createAssistantGroupId,
  MIN_HOLD_MS,
} from '../../constants/assistantRecording';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { openAssistantAsrStream, type AssistantAsrStreamSession } from '../../utils/assistantAsrStream';
import {
  isPcmAudioStreamAvailable,
  startPcmAudioStream,
  stopPcmAudioStream,
  subscribePcmChunks,
} from '../../utils/pcmAudioStreamNative';
import DefaultAvatar from '../profile/DefaultAvatar';
import VoiceWaveform from './VoiceWaveform';

type VoiceState = 'idle' | 'listening' | 'processing';
type ProcessingPhase = 'transcribing' | 'analyzing';

const HINTS = [
  '明天下午三点开会',
  '把明天的开会改到四点',
  '删除明天的开会',
];

const BOTTOM_GLOW_COLORS = [
  'rgba(238,242,250,0)',
  'rgba(79,124,255,0.2)',
  'rgba(111,196,220,0.34)',
  'rgba(167,186,255,0.46)',
] as const;

interface PendingConfirm {
  messageId: string;
  intent: string;
  reply: string;
  asrText: string;
  scheduleDraft: ScheduleDraft;
}

function getConfirmCopy(intent: string) {
  switch (intent) {
    case 'update_schedule':
      return {
        status: '请确认是否修改日程',
        action: '确认后将更新你的日程',
        confirmLabel: '确认修改',
        destructive: false,
      };
    case 'delete_schedule':
      return {
        status: '请确认是否删除日程',
        action: '确认后将永久删除此日程',
        confirmLabel: '确认删除',
        destructive: true,
      };
    default:
      return {
        status: '请确认是否创建日程',
        action: '确认后将写入你的日程',
        confirmLabel: '确认创建',
        destructive: false,
      };
  }
}

interface AssistantChatOverlayProps {
  onClose: () => void;
  onScheduleCreated?: () => void;
}

function formatDraftTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AssistantChatOverlay({
  onClose,
  onScheduleCreated,
}: AssistantChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();

  const groupIdRef = useRef(createAssistantGroupId());
  const holdStartedAtRef = useRef<number | null>(null);
  const asrSessionRef = useRef<AssistantAsrStreamSession | null>(null);
  const unsubscribeChunksRef = useRef<(() => void) | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('transcribing');
  const [hintIndex, setHintIndex] = useState(0);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [permissionReady, setPermissionReady] = useState(false);

  const backdropOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(120);
  const micPulse = useSharedValue(1);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
    panelTranslateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [backdropOpacity, panelTranslateY]);

  useEffect(() => {
    let active = true;

    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!active) {
        return;
      }
      if (!status.granted) {
        Alert.alert('需要麦克风权限', '请在系统设置中允许 Schedjun 使用麦克风。');
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      if (active) {
        setPermissionReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % HINTS.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (voiceState === 'listening') {
      micPulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }
    micPulse.value = withTiming(1, { duration: 200 });
  }, [voiceState, micPulse]);

  const cleanupListening = useCallback(async () => {
    unsubscribeChunksRef.current?.();
    unsubscribeChunksRef.current = null;
    await stopPcmAudioStream();
    asrSessionRef.current?.close();
    asrSessionRef.current = null;
    holdStartedAtRef.current = null;
  }, []);

  const analyzeAsrText = useCallback(
    async (asrText: string) => {
      if (!accessToken) {
        Alert.alert('请先登录', '登录后才能使用君听语音助手。');
        setVoiceState('idle');
        return;
      }

      setProcessingPhase('analyzing');

      try {
        const data = await textToScheduleApi(accessToken, {
          groupId: groupIdRef.current,
          text: asrText,
          timezone: user?.timezone,
        });

        setAssistantReply(data.reply);

        if (data.needConfirm && data.scheduleDraft) {
          setPendingConfirm({
            messageId: data.messageId,
            intent: data.intent,
            reply: data.reply,
            asrText: data.asrText,
            scheduleDraft: data.scheduleDraft,
          });
          return;
        }

        if (data.schedule || data.intent === 'delete_schedule') {
          onScheduleCreated?.();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '理解失败';
        Alert.alert('君听', message);
        setAssistantReply(null);
      } finally {
        setVoiceState('idle');
      }
    },
    [accessToken, onScheduleCreated, user?.timezone],
  );

  const startListening = useCallback(async () => {
    if (!permissionReady) {
      Alert.alert('麦克风未就绪', '请稍候或检查麦克风权限。');
      return;
    }
    if (!isPcmAudioStreamAvailable()) {
      Alert.alert('设备不支持', '当前设备未启用 PCM 流式录音模块。');
      return;
    }
    if (!accessToken) {
      Alert.alert('请先登录', '登录后才能使用君听语音助手。');
      return;
    }
    if (voiceState !== 'idle') {
      return;
    }

    setAssistantReply(null);
    setPendingConfirm(null);

    try {
      const session = await openAssistantAsrStream(accessToken);
      asrSessionRef.current = session;
      unsubscribeChunksRef.current = subscribePcmChunks((base64) => {
        session.sendAudio(base64);
      });
      await startPcmAudioStream();
      holdStartedAtRef.current = Date.now();
      setVoiceState('listening');
    } catch (error) {
      await cleanupListening();
      const message = error instanceof Error ? error.message : '无法开始录音';
      Alert.alert('君听', message);
      setVoiceState('idle');
    }
  }, [accessToken, cleanupListening, permissionReady, voiceState]);

  const stopListening = useCallback(async () => {
    if (voiceState !== 'listening') {
      return;
    }

    const startedAt = holdStartedAtRef.current;
    const session = asrSessionRef.current;

    if (startedAt != null && Date.now() - startedAt < MIN_HOLD_MS) {
      await cleanupListening();
      setVoiceState('idle');
      Alert.alert('录音太短', '请按住麦克风至少 1～2 秒，清晰说完再松开。');
      return;
    }

    setVoiceState('processing');
    setProcessingPhase('transcribing');

    try {
      unsubscribeChunksRef.current?.();
      unsubscribeChunksRef.current = null;
      await stopPcmAudioStream();

      if (!session) {
        throw new Error('语音识别会话不存在');
      }

      const asrText = await session.finish();
      session.close();
      asrSessionRef.current = null;
      holdStartedAtRef.current = null;

      await analyzeAsrText(asrText);
    } catch (error) {
      await cleanupListening();
      const message = error instanceof Error ? error.message : '语音识别失败';
      Alert.alert('君听', message);
      setAssistantReply(null);
      setVoiceState('idle');
    }
  }, [analyzeAsrText, cleanupListening, voiceState]);

  useEffect(() => {
    return () => {
      void cleanupListening();
    };
  }, [cleanupListening]);

  const handleConfirm = useCallback(async () => {
    if (!accessToken || !pendingConfirm) {
      return;
    }

    setVoiceState('processing');
    try {
      const data = await confirmAssistantApi(accessToken, {
        groupId: groupIdRef.current,
        messageId: pendingConfirm.messageId,
        action: 'confirm',
        scheduleDraft: pendingConfirm.scheduleDraft,
      });
      setAssistantReply(data.reply);
      setPendingConfirm(null);
      onScheduleCreated?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建日程失败';
      Alert.alert('确认失败', message);
    } finally {
      setVoiceState('idle');
    }
  }, [accessToken, onScheduleCreated, pendingConfirm]);

  const handleCancel = useCallback(async () => {
    if (!accessToken || !pendingConfirm) {
      setPendingConfirm(null);
      return;
    }

    setVoiceState('processing');
    try {
      const data = await confirmAssistantApi(accessToken, {
        groupId: groupIdRef.current,
        messageId: pendingConfirm.messageId,
        action: 'cancel',
      });
      setAssistantReply(data.reply);
      setPendingConfirm(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      Alert.alert('君听', message);
    } finally {
      setVoiceState('idle');
    }
  }, [accessToken, pendingConfirm]);

  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';

  const confirmCopy = pendingConfirm ? getConfirmCopy(pendingConfirm.intent) : null;

  const statusText = isProcessing
    ? processingPhase === 'transcribing'
      ? '正在识别语音...'
      : '正在理解安排...'
    : isListening
      ? '我在听，请说...'
      : pendingConfirm && confirmCopy
        ? confirmCopy.status
        : '按住麦克风，告诉我你的安排';

  const actionText = isProcessing
    ? processingPhase === 'transcribing'
      ? '流式听写收尾中'
      : 'AI 正在解析意图'
    : isListening
      ? '松开结束'
      : pendingConfirm && confirmCopy
        ? confirmCopy.action
        : '支持创建、查询、修改与删除日程';

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
    opacity: backdropOpacity.value,
  }));

  const micRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
    opacity: isListening ? 0.35 : 0,
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <View style={styles.panelWrap} pointerEvents="box-none">
        <Animated.View
          style={[styles.panel, { paddingBottom: insets.bottom + spacing.md }, panelStyle]}
        >
          <LinearGradient
            colors={[...BOTTOM_GLOW_COLORS]}
            locations={[0, 0.32, 0.68, 1]}
            style={styles.bottomGlow}
            pointerEvents="none"
          />

          <Pressable style={styles.handleArea} onPress={onClose}>
            <View style={styles.handle} />
          </Pressable>

          <View style={styles.voiceCard}>
            <View style={styles.agentRow}>
              <DefaultAvatar nickname="君听" size={40} />
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>君听</Text>
                <Text style={styles.agentRole}>你的日程语音助手</Text>
              </View>
            </View>

            {assistantReply ? (
              <View style={styles.replyBubble}>
                <Text style={styles.replyText}>{assistantReply}</Text>
              </View>
            ) : null}

            {pendingConfirm ? (
              <View
                style={[
                  styles.confirmCard,
                  confirmCopy?.destructive && styles.confirmCardDanger,
                ]}
              >
                <Text style={styles.confirmTitle}>{pendingConfirm.scheduleDraft.title}</Text>
                {pendingConfirm.intent === 'delete_schedule' ? (
                  <Text style={styles.confirmWarning}>此操作不可撤销</Text>
                ) : (
                  <Text style={styles.confirmTime}>
                    {formatDraftTime(pendingConfirm.scheduleDraft.startTime)}
                    {' - '}
                    {formatDraftTime(pendingConfirm.scheduleDraft.endTime)}
                  </Text>
                )}
                <View style={styles.confirmActions}>
                  <Pressable
                    style={[styles.confirmButton, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={isProcessing}
                  >
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.confirmButton,
                      confirmCopy?.destructive ? styles.deleteButton : styles.createButton,
                    ]}
                    onPress={handleConfirm}
                    disabled={isProcessing}
                  >
                    <Text style={styles.createButtonText}>
                      {confirmCopy?.confirmLabel ?? '确认'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text style={styles.statusText}>{statusText}</Text>

            <View style={styles.waveformWrap}>
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <VoiceWaveform active={isListening} size="large" />
              )}
            </View>

            {!pendingConfirm ? (
              <View style={styles.hintBubble}>
                <Text style={styles.hintLabel}>试试说</Text>
                <Text style={styles.hintText}>「{HINTS[hintIndex]}」</Text>
              </View>
            ) : null}

            <View style={styles.micArea}>
              <Animated.View style={[styles.micRing, micRingStyle]} />
              <Pressable
                style={[
                  styles.micButton,
                  isListening && styles.micButtonActive,
                  isProcessing && styles.micButtonDisabled,
                ]}
                onPressIn={startListening}
                onPressOut={stopListening}
                disabled={isProcessing}
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={30}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            <Text style={styles.actionText}>{actionText}</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  panelWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    paddingHorizontal: spacing.md,
    overflow: 'visible',
  },
  bottomGlow: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: 0,
    height: 220,
  },
  handleArea: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  voiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.text,
  },
  agentRole: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  replyBubble: {
    alignSelf: 'stretch',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  replyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  confirmCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(79, 124, 255, 0.25)',
  },
  confirmCardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  confirmTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  confirmTime: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  confirmWarning: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#DC2626',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  cancelButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  createButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  statusText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  waveformWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  hintBubble: {
    alignSelf: 'stretch',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hintLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  hintText: {
    marginTop: 2,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  micArea: {
    marginTop: spacing.lg,
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  micButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  micButtonDisabled: {
    opacity: 0.55,
  },
  actionText: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
