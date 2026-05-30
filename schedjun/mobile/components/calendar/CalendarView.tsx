import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';

import { colors, radius, spacing } from '../../constants/theme';
import {
  MonthRef,
  addMonths,
  createMonthRef,
  isSameDay,
  monthDiff,
} from '../../utils/calendarUtils';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import CalendarMenu from './CalendarMenu';
import DateJumpModal from './DateJumpModal';
import JumpToTodayButton from './JumpToTodayButton';
import SelectedDayDetail from './SelectedDayDetail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL = spacing.lg;
const PAGE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL * 2;

interface CalendarViewProps {
  onAddPress?: (selectedDate: Date) => void;
  onMySchedulePress?: () => void;
}

export default function CalendarView({ onAddPress, onMySchedulePress }: CalendarViewProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const baseMonth = useMemo(() => createMonthRef(today), [today]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [menuVisible, setMenuVisible] = useState(false);
  const [dateJumpVisible, setDateJumpVisible] = useState(false);
  const slideDirection = useRef(1);

  const visibleMonth = useMemo(
    () => addMonths(baseMonth, monthOffset),
    [baseMonth, monthOffset],
  );

  const changeMonth = useCallback(
    (delta: number) => {
      slideDirection.current = delta;
      setMonthOffset((offset) => {
        const newOffset = offset + delta;
        const newMonth = addMonths(baseMonth, newOffset);
        setSelectedDate(new Date(newMonth.year, newMonth.month, 1));
        return newOffset;
      });
    },
    [baseMonth],
  );

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
  const showJumpToToday = !isSameDay(selectedDate, today);

  const handleJumpToToday = useCallback(() => {
    handleSelectDate(today);
  }, [handleSelectDate, today]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <CalendarHeader
          monthRef={visibleMonth}
          today={today}
          onAddPress={() => onAddPress?.(selectedDate)}
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

      {showJumpToToday && (
        <View style={styles.jumpToTodayRow}>
          <JumpToTodayButton onPress={handleJumpToToday} />
        </View>
      )}

      <SelectedDayDetail selectedDate={selectedDate} compactTop={showJumpToToday} />

      <CalendarMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onMySchedulePress={onMySchedulePress}
        onDateJumpPress={() => setDateJumpVisible(true)}
      />

      <DateJumpModal
        visible={dateJumpVisible}
        value={selectedDate}
        onClose={() => setDateJumpVisible(false)}
        onConfirm={handleSelectDate}
      />
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
  jumpToTodayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingRight: spacing.xs,
  },
});
