import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../constants/theme';

const BODY = 64;

interface AssistantCharacterProps {
  isDragging: boolean;
}

export default function AssistantCharacter({ isDragging }: AssistantCharacterProps) {
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);
  const blink = useSharedValue(1);
  const leftArm = useSharedValue(0);
  const rightArm = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const dragScale = useSharedValue(1);

  useEffect(() => {
    if (isDragging) {
      cancelAnimation(bob);
      cancelAnimation(sway);
      cancelAnimation(leftArm);
      cancelAnimation(rightArm);
      bob.value = 0;
      sway.value = 0;
      dragScale.value = withTiming(1.12, { duration: 150 });
      return;
    }

    dragScale.value = withTiming(1, { duration: 180 });
    bob.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    leftArm.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(6, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    rightArm.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.2, { duration: 600 }),
      ),
      -1,
      true,
    );

    const blinkLoop = () => {
      blink.value = withDelay(
        2800 + Math.random() * 1200,
        withSequence(
          withTiming(0.08, { duration: 90 }),
          withTiming(1, { duration: 120 }),
        ),
      );
    };
    blinkLoop();
    const interval = setInterval(blinkLoop, 3800);
    return () => clearInterval(interval);
  }, [isDragging, bob, sway, blink, leftArm, rightArm, sparkle, dragScale]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { rotate: `${sway.value}deg` },
      { scale: dragScale.value },
    ],
  }));

  const leftArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leftArm.value}deg` }],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rightArm.value}deg` }],
  }));

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const sparkleLeftStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
    transform: [{ scale: 0.7 + sparkle.value * 0.35 }],
  }));

  const sparkleRightStyle = useAnimatedStyle(() => ({
    opacity: 1.1 - sparkle.value,
    transform: [{ scale: 0.7 + (1 - sparkle.value) * 0.35 }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.sparkle, styles.sparkleLeft, sparkleLeftStyle]} />
      <Animated.View style={[styles.sparkle, styles.sparkleRight, sparkleRightStyle]} />

      <Animated.View style={[styles.leftArm, leftArmStyle]}>
        <View style={styles.armDot} />
      </Animated.View>
      <Animated.View style={[styles.rightArm, rightArmStyle]}>
        <View style={styles.armDot} />
      </Animated.View>

      <Animated.View style={[styles.body, bodyStyle]}>
        <View style={styles.faceHighlight} />
        <View style={styles.blushRow}>
          <View style={styles.blush} />
          <View style={styles.blush} />
        </View>
        <View style={styles.eyeRow}>
          <Animated.View style={[styles.eye, leftEyeStyle]}>
            <View style={styles.pupil} />
            <View style={styles.eyeShine} />
          </Animated.View>
          <Animated.View style={[styles.eye, rightEyeStyle]}>
            <View style={styles.pupil} />
            <View style={styles.eyeShine} />
          </Animated.View>
        </View>
        <View style={styles.mouth} />
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      </Animated.View>

      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: BODY + 28,
    height: BODY + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: BODY,
    height: BODY,
    borderRadius: BODY / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  faceHighlight: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 22,
    height: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  blushRow: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  blush: {
    width: 12,
    height: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 130, 160, 0.45)',
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: -2,
  },
  eye: {
    width: 14,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pupil: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A2744',
    marginTop: 2,
  },
  eyeShine: {
    position: 'absolute',
    top: 3,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  mouth: {
    marginTop: 6,
    width: 16,
    height: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#FF8FA8',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  leftArm: {
    position: 'absolute',
    left: 2,
    top: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightArm: {
    position: 'absolute',
    right: 2,
    top: 28,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  armDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6B96FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFD86B',
    transform: [{ rotate: '45deg' }],
  },
  sparkleLeft: {
    top: 4,
    left: 8,
  },
  sparkleRight: {
    top: 10,
    right: 6,
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    width: 46,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(79, 124, 255, 0.18)',
  },
});
