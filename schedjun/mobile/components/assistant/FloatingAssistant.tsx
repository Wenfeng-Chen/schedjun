import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import AssistantCharacter from './AssistantCharacter';
import AssistantChatOverlay from './AssistantChatOverlay';

const ASSISTANT_WIDTH = 92;
const ASSISTANT_HEIGHT = 88;
const BUBBLE_TOP_OVERFLOW = 38;
const LONG_PRESS_MS = 320;
const EDGE_MARGIN = 12;

export default function FloatingAssistant() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [isDragging, setIsDragging] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const bubbleOpacity = useSharedValue(1);

  const dragActivated = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionStart = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const minX = EDGE_MARGIN;
      const maxX = screenWidth - ASSISTANT_WIDTH - EDGE_MARGIN;
      const minY = insets.top + EDGE_MARGIN;
      const maxY = screenHeight - ASSISTANT_HEIGHT - insets.bottom - EDGE_MARGIN;
      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
      };
    },
    [insets.bottom, insets.top, screenHeight, screenWidth],
  );

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    const initial = clampPosition(
      screenWidth - ASSISTANT_WIDTH - spacing.lg,
      screenHeight - ASSISTANT_HEIGHT - insets.bottom - 112,
    );
    translateX.value = initial.x;
    translateY.value = initial.y;
  }, [clampPosition, insets.bottom, screenHeight, screenWidth, translateX, translateY]);

  useEffect(() => {
    if (chatOpen) {
      bubbleOpacity.value = withSpring(0);
      return;
    }
    bubbleOpacity.value = withSpring(showBubble ? 1 : 0);
  }, [bubbleOpacity, chatOpen, showBubble]);

  useEffect(() => {
    if (chatOpen) {
      return;
    }
    const timer = setInterval(() => {
      setShowBubble((prev) => !prev);
    }, 4200);
    return () => clearInterval(timer);
  }, [chatOpen]);

  const finishDrag = useCallback(() => {
    const clamped = clampPosition(translateX.value, translateY.value);
    translateX.value = withSpring(clamped.x, { damping: 18, stiffness: 220 });
    translateY.value = withSpring(clamped.y, { damping: 18, stiffness: 220 });
    setIsDragging(false);
    dragActivated.current = false;
  }, [clampPosition, translateX, translateY]);

  const handleTap = useCallback(() => {
    setChatOpen(true);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const finishDragRef = useRef(finishDrag);
  finishDragRef.current = finishDrag;
  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;
  const clearLongPressTimerRef = useRef(clearLongPressTimer);
  clearLongPressTimerRef.current = clearLongPressTimer;
  const setIsDraggingRef = useRef(setIsDragging);
  setIsDraggingRef.current = setIsDragging;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => dragActivated.current,
      onPanResponderGrant: () => {
        dragActivated.current = false;
        positionStart.current = {
          x: translateX.value,
          y: translateY.value,
        };
        clearLongPressTimerRef.current();
        longPressTimer.current = setTimeout(() => {
          dragActivated.current = true;
          setIsDraggingRef.current(true);
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_, gesture) => {
        const moved =
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8;
        if (!dragActivated.current && moved) {
          clearLongPressTimerRef.current();
          return;
        }
        if (dragActivated.current) {
          translateX.value = positionStart.current.x + gesture.dx;
          translateY.value = positionStart.current.y + gesture.dy;
        }
      },
      onPanResponderRelease: (_, gesture) => {
        clearLongPressTimerRef.current();
        const moved =
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8;
        if (dragActivated.current) {
          finishDragRef.current();
          return;
        }
        if (!moved) {
          handleTapRef.current();
        }
        dragActivated.current = false;
      },
      onPanResponderTerminate: () => {
        clearLongPressTimerRef.current();
        if (dragActivated.current) {
          finishDragRef.current();
        }
      },
    }),
  ).current;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value - BUBBLE_TOP_OVERFLOW },
    ],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: 0.92 + bubbleOpacity.value * 0.08 }],
  }));

  return (
    <>
      {chatOpen && (
        <Modal
          transparent
          visible
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setChatOpen(false)}
        >
          <AssistantChatOverlay onClose={() => setChatOpen(false)} />
        </Modal>
      )}

      {!chatOpen && (
        <View style={styles.host} pointerEvents="box-none">
          <Animated.View
            style={[styles.assistant, containerStyle]}
            pointerEvents="box-none"
          >
            <View style={styles.touchArea} {...panResponder.panHandlers}>
              <Animated.View
                style={[styles.bubble, bubbleStyle]}
                pointerEvents="none"
              >
                <Text style={styles.bubbleText}>说说你的安排～</Text>
                <View style={styles.bubbleTail} />
              </Animated.View>

              {isDragging && (
                <View style={styles.dragHint} pointerEvents="none">
                  <Text style={styles.dragHintText}>拖动中</Text>
                </View>
              )}

              <AssistantCharacter isDragging={isDragging} />
            </View>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
  },
  assistant: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
  },
  touchArea: {
    width: ASSISTANT_WIDTH,
    height: ASSISTANT_HEIGHT + BUBBLE_TOP_OVERFLOW,
    paddingTop: BUBBLE_TOP_OVERFLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    top: 0,
    minWidth: 118,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  dragHint: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(79, 124, 255, 0.92)',
  },
  dragHintText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});
