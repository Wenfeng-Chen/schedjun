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

type WaveformSize = 'compact' | 'large';

interface VoiceWaveformProps {
  active?: boolean;
  size?: WaveformSize;
}

const PRESETS = {
  compact: {
    barCount: 5,
    barHeights: [10, 16, 12, 18, 11],
    barWidth: 3,
    gap: 3,
    containerHeight: 20,
  },
  large: {
    barCount: 9,
    barHeights: [14, 28, 18, 36, 22, 32, 16, 26, 12],
    barWidth: 4,
    gap: 5,
    containerHeight: 40,
  },
} as const;

function WaveBar({
  index,
  active,
  height,
  barWidth,
}: {
  index: number;
  active: boolean;
  height: number;
  barWidth: number;
}) {
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(0.3, { duration: 200 });
      return;
    }
    scale.value = withDelay(
      index * 70,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 260 + index * 35, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 260 + index * 35, easing: Easing.inOut(Easing.quad) }),
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
        {
          width: barWidth,
          height,
          backgroundColor: colors.primary,
        },
        barStyle,
      ]}
    />
  );
}

export default function VoiceWaveform({ active = true, size = 'compact' }: VoiceWaveformProps) {
  const preset = PRESETS[size];

  return (
    <View
      style={[
        styles.container,
        {
          gap: preset.gap,
          height: preset.containerHeight,
        },
      ]}
    >
      {Array.from({ length: preset.barCount }).map((_, index) => (
        <WaveBar
          key={index}
          index={index}
          active={active}
          height={preset.barHeights[index]}
          barWidth={preset.barWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 3,
  },
});
