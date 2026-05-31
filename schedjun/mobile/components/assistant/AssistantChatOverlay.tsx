import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import DefaultAvatar from '../profile/DefaultAvatar';
import VoiceWaveform from './VoiceWaveform';

type VoiceState = 'idle' | 'listening';

const HINTS = [
  '明天下午三点开会',
  '每周一上午十点团队站会',
  '下周五提醒交周报',
];

const BOTTOM_GLOW_COLORS = [
  'rgba(238,242,250,0)',
  'rgba(79,124,255,0.2)',
  'rgba(111,196,220,0.34)',
  'rgba(167,186,255,0.46)',
] as const;

interface AssistantChatOverlayProps {
  onClose: () => void;
}

export default function AssistantChatOverlay({ onClose }: AssistantChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [hintIndex, setHintIndex] = useState(0);

  const backdropOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(120);
  const micPulse = useSharedValue(1);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
    panelTranslateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    setVoiceState('idle');
  }, [backdropOpacity, panelTranslateY]);

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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
    opacity: backdropOpacity.value,
  }));

  const micRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
    opacity: voiceState === 'listening' ? 0.35 : 0,
  }));

  const toggleListening = () => {
    setVoiceState((prev) => (prev === 'idle' ? 'listening' : 'idle'));
  };

  const statusText = voiceState === 'listening' ? '我在听，请说...' : '点击麦克风，告诉我你的安排';
  const actionText = voiceState === 'listening' ? '再次点击结束' : '支持创建、查询与修改日程';

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

            <Text style={styles.statusText}>{statusText}</Text>

            <View style={styles.waveformWrap}>
              <VoiceWaveform active={voiceState === 'listening'} size="large" />
            </View>

            <View style={styles.hintBubble}>
              <Text style={styles.hintLabel}>试试说</Text>
              <Text style={styles.hintText}>「{HINTS[hintIndex]}」</Text>
            </View>

            <View style={styles.micArea}>
              <Animated.View style={[styles.micRing, micRingStyle]} />
              <Pressable
                style={[
                  styles.micButton,
                  voiceState === 'listening' && styles.micButtonActive,
                ]}
                onPress={toggleListening}
              >
                <Ionicons
                  name={voiceState === 'listening' ? 'mic' : 'mic-outline'}
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
    marginBottom: spacing.lg,
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
  actionText: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
