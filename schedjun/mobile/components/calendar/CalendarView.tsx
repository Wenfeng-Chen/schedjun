import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';

import { colors, radius, spacing } from '../../constants/theme';
import {
  MonthRef,
  addMonths,
  createMonthRef,
  monthDiff,
} from '../../utils/calendarUtils';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import CalendarMenu from './CalendarMenu';
import SelectedDayDetail from './SelectedDayDetail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL = spacing.lg;
const PAGE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL * 2;

export default function CalendarView() {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const baseMonth = useMemo(() => createMonthRef(today), [today]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideDirection = useRef(1);

  const visibleMonth = useMemo(
    () => addMonths(baseMonth, monthOffset),
    [baseMonth, monthOffset],
  );

  const changeMonth = useCallback((delta: number) => {
    slideDirection.current = delta;
    setMonthOffset((offset) => offset + delta);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 12,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          changeMonth(1);
        } else if (gesture.dx > 40) {
          changeMonth(-1);
        }
      },
    }),
  ).current;

  const handleSelectDate = useCallback(
    (date: Date) => {
      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(normalized);

      const monthRef = createMonthRef(normalized);
      const diff = monthDiff(monthRef, baseMonth);
      if (diff !== monthOffset) {
        slideDirection.current = diff > monthOffset ? 1 : -1;
        setMonthOffset(diff);
      }
    },
    [baseMonth, monthOffset],
  );

  const monthKey = `${visibleMonth.year}-${visibleMonth.month}`;
  const entering =
    slideDirection.current > 0
      ? SlideInRight.duration(260)
      : SlideInLeft.duration(260);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <CalendarHeader
          monthRef={visibleMonth}
          today={today}
          onAddPress={() => undefined}
          onMenuPress={() => setMenuVisible(true)}
        />

        <View style={styles.calendarBody} {...panResponder.panHandlers}>
          <Animated.View key={monthKey} entering={entering}>
            <CalendarGrid
              monthRef={visibleMonth}
              today={today}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              gridWidth={PAGE_WIDTH}
              monthKey={monthKey}
            />
          </Animated.View>
        </View>
      </View>

      <SelectedDayDetail selectedDate={selectedDate} today={today} />

      <CalendarMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CARD_HORIZONTAL,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden',
  },
  calendarBody: {
    width: PAGE_WIDTH,
  },
});
