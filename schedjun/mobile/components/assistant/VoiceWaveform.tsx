import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../constants/theme';

const BAR_COUNT = 5;
const BAR_HEIGHTS = [10, 16, 12, 18, 11];
const BAR_COLOR = colors.primary;

function WaveBar({ index, active }: { index: number; active: boolean }) {
  const scale = useSharedValue(0.35);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(0.35, { duration: 200 });
      return;
    }
    scale.value = withDelay(
      index * 80,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 280 + index * 40, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 280 + index * 40, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [active, index, scale]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { height: BAR_HEIGHTS[index], backgroundColor: BAR_COLOR },
        barStyle,
      ]}
    />
  );
}

interface VoiceWaveformProps {
  active?: boolean;
}

export default function VoiceWaveform({ active = true }: VoiceWaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        <WaveBar key={index} index={index} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
