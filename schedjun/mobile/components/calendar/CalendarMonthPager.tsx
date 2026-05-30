import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MonthRef, addMonths } from '../../utils/calendarUtils';
import CalendarGrid from './CalendarGrid';

const SWIPE_TIMING = {
  duration: 240,
  easing: Easing.out(Easing.cubic),
};

const SNAP_BACK_TIMING = {
  duration: 200,
  easing: Easing.out(Easing.quad),
};

interface CalendarMonthPagerProps {
  baseMonth: MonthRef;
  monthOffset: number;
  today: Date;
  selectedDate: Date;
  pageWidth: number;
  onSelectDate: (date: Date) => void;
  onSwipeMonthStart: (delta: number) => void;
  onSwipeMonthComplete: (delta: number) => void;
}

export default function CalendarMonthPager({
  baseMonth,
  monthOffset,
  today,
  selectedDate,
  pageWidth,
  onSelectDate,
  onSwipeMonthStart,
  onSwipeMonthComplete,
}: CalendarMonthPagerProps) {
  const translateX = useSharedValue(-pageWidth);
  const isSwipingRef = useRef(false);

  const prevMonth = useMemo(
    () => addMonths(baseMonth, monthOffset - 1),
    [baseMonth, monthOffset],
  );
  const currentMonth = useMemo(
    () => addMonths(baseMonth, monthOffset),
    [baseMonth, monthOffset],
  );
  const nextMonth = useMemo(
    () => addMonths(baseMonth, monthOffset + 1),
    [baseMonth, monthOffset],
  );

  useLayoutEffect(() => {
    if (isSwipingRef.current) {
      cancelAnimation(translateX);
      translateX.value = -pageWidth;
      isSwipingRef.current = false;
      return;
    }

    cancelAnimation(translateX);
    translateX.value = -pageWidth;
  }, [monthOffset, pageWidth, translateX]);

  const commitSwipeStart = useCallback(
    (delta: number) => {
      isSwipingRef.current = true;
      onSwipeMonthStart(delta);
    },
    [onSwipeMonthStart],
  );

  const commitSwipeComplete = useCallback(
    (delta: number) => {
      onSwipeMonthComplete(delta);
    },
    [onSwipeMonthComplete],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
        onPanResponderMove: (_, gesture) => {
          translateX.value = -pageWidth + gesture.dx;
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = pageWidth * 0.22;
          const velocity = gesture.vx;

          if (gesture.dx < -threshold || velocity < -0.35) {
            runOnJS(commitSwipeStart)(1);
            translateX.value = withTiming(-pageWidth * 2, SWIPE_TIMING, (finished) => {
              if (finished) {
                runOnJS(commitSwipeComplete)(1);
              }
            });
            return;
          }

          if (gesture.dx > threshold || velocity > 0.35) {
            runOnJS(commitSwipeStart)(-1);
            translateX.value = withTiming(0, SWIPE_TIMING, (finished) => {
              if (finished) {
                runOnJS(commitSwipeComplete)(-1);
              }
            });
            return;
          }

          translateX.value = withTiming(-pageWidth, SNAP_BACK_TIMING);
        },
        onPanResponderTerminate: () => {
          translateX.value = withTiming(-pageWidth, SNAP_BACK_TIMING);
        },
      }),
    [commitSwipeComplete, commitSwipeStart, pageWidth, translateX],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.viewport, { width: pageWidth }]} {...panResponder.panHandlers}>
      <Animated.View style={[styles.track, { width: pageWidth * 3 }, animatedStyle]}>
        <View style={{ width: pageWidth }}>
          <CalendarGrid
            monthRef={prevMonth}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            gridWidth={pageWidth}
            monthKey={`${prevMonth.year}-${prevMonth.month}`}
            disableEnterAnimation
          />
        </View>
        <View style={{ width: pageWidth }}>
          <CalendarGrid
            monthRef={currentMonth}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            gridWidth={pageWidth}
            monthKey={`${currentMonth.year}-${currentMonth.month}`}
            disableEnterAnimation
          />
        </View>
        <View style={{ width: pageWidth }}>
          <CalendarGrid
            monthRef={nextMonth}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            gridWidth={pageWidth}
            monthKey={`${nextMonth.year}-${nextMonth.month}`}
            disableEnterAnimation
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
});
