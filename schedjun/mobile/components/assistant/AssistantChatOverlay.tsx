import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import VoiceWaveform from './VoiceWaveform';

type InputMode = 'voice' | 'text';

/** 底部光晕：主色蓝 → 天青 → 淡紫，与 App 冷色背景统一 */
const BOTTOM_GLOW_COLORS = [
  'rgba(238,242,250,0)',
  'rgba(79,124,255,0.2)',
  'rgba(111,196,220,0.34)',
  'rgba(167,186,255,0.46)',
] as const;

const INPUT_BORDER_COLORS = ['#4F7CFF', '#6BA3FF', '#94C4F0'] as const;

interface AssistantChatOverlayProps {
  onClose: () => void;
}

export default function AssistantChatOverlay({ onClose }: AssistantChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const backdropOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(120);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
    panelTranslateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    setInputMode('voice');
    setText('');

    return () => {
      Keyboard.dismiss();
    };
  }, [backdropOpacity, panelTranslateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
    opacity: backdropOpacity.value,
  }));

  const switchToText = () => {
    setInputMode('text');
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const switchToVoice = () => {
    Keyboard.dismiss();
    setInputMode('voice');
  };

  const panelBottomPadding =
    keyboardHeight > 0
      ? keyboardHeight + spacing.md + (Platform.OS === 'android' ? 12 : 4)
      : insets.bottom + spacing.sm;

  const showBottomGlow = keyboardHeight === 0;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <View style={styles.keyboardWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.panel,
            { paddingBottom: panelBottomPadding },
            panelStyle,
          ]}
        >
          {showBottomGlow && (
            <Pressable style={styles.handleArea} onPress={onClose}>
              <View style={styles.handle} />
            </Pressable>
          )}

          <View style={styles.inputWrapper}>
            {showBottomGlow && (
              <LinearGradient
                colors={[...BOTTOM_GLOW_COLORS]}
                locations={[0, 0.32, 0.68, 1]}
                style={styles.bottomGlow}
                pointerEvents="none"
              />
            )}

            <LinearGradient
            colors={[...INPUT_BORDER_COLORS]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.inputBorder}
          >
            <View style={styles.inputBar}>
              <Pressable
                style={styles.inputCenter}
                onPress={inputMode === 'voice' ? switchToText : undefined}
              >
                {inputMode === 'voice' ? (
                  <>
                    <Text style={styles.listeningText}>我在听...</Text>
                    <VoiceWaveform active />
                  </>
                ) : (
                  <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    placeholder="输入日程内容..."
                    placeholderTextColor={colors.textMuted}
                    value={text}
                    onChangeText={setText}
                    returnKeyType="send"
                    multiline={false}
                  />
                )}
              </Pressable>

              {inputMode === 'text' ? (
                <Pressable style={styles.iconButton} onPress={switchToVoice} hitSlop={6}>
                  <Ionicons name="mic-outline" size={22} color={colors.primary} />
                </Pressable>
              ) : (
                <Pressable style={styles.iconButton} onPress={switchToText} hitSlop={6}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </LinearGradient>
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
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    paddingHorizontal: spacing.md,
    overflow: 'visible',
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  bottomGlow: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -36,
    height: 100,
    zIndex: 0,
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
  inputBorder: {
    borderRadius: radius.xl + 4,
    padding: 2.5,
    zIndex: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 4,
    minHeight: 56,
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 36,
  },
  listeningText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    minHeight: 36,
  },
});
