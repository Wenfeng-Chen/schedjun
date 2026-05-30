import { useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';
import {
  addMonths,
  createMonthRef,
  isSameDay,
  monthDiff,
} from '../../utils/calendarUtils';
import { ScheduleItem } from '../../constants/scheduleTypes';
import { getSchedulesForDate } from '../../utils/scheduleDetailUtils';
import CalendarHeader from './CalendarHeader';
import CalendarMenu from './CalendarMenu';
import CalendarMonthPager from './CalendarMonthPager';
import DateJumpModal from './DateJumpModal';
import JumpToTodayButton from './JumpToTodayButton';
import SelectedDayDetail from './SelectedDayDetail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL = spacing.lg;
const PAGE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL * 2;

interface CalendarPageState {
  monthOffset: number;
  selectedDate: Date;
}

interface CalendarViewProps {
  schedules: ScheduleItem[];
  onAddPress?: (selectedDate: Date) => void;
  onMySchedulePress?: () => void;
  onSchedulePress?: (scheduleId: string) => void;
}

export default function CalendarView({
  schedules,
  onAddPress,
  onMySchedulePress,
  onSchedulePress,
}: CalendarViewProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const baseMonth = useMemo(() => createMonthRef(today), [today]);
  const [pageState, setPageState] = useState<CalendarPageState>({
    monthOffset: 0,
    selectedDate: today,
  });
  const { monthOffset, selectedDate } = pageState;
  const [headerMonthOffset, setHeaderMonthOffset] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [dateJumpVisible, setDateJumpVisible] = useState(false);

  const visibleMonth = useMemo(
    () => addMonths(baseMonth, headerMonthOffset),
    [baseMonth, headerMonthOffset],
  );

  const daySchedules = useMemo(
    () => getSchedulesForDate(schedules, selectedDate),
    [schedules, selectedDate],
  );

  const handleSwipeMonthStart = useCallback((delta: number) => {
    setHeaderMonthOffset((offset) => offset + delta);
  }, []);

  const handleSwipeMonthComplete = useCallback(
    (delta: number) => {
      setPageState((prev) => {
        const newOffset = prev.monthOffset + delta;
        const newMonth = addMonths(baseMonth, newOffset);
        return {
          monthOffset: newOffset,
          selectedDate: new Date(newMonth.year, newMonth.month, 1),
        };
      });
    },
    [baseMonth],
  );

  const handleSelectDate = useCallback(
    (date: Date) => {
      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const monthRef = createMonthRef(normalized);
      const diff = monthDiff(monthRef, baseMonth);

      setHeaderMonthOffset(diff);
      setPageState({
        monthOffset: diff,
        selectedDate: normalized,
      });
    },
    [baseMonth],
  );

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

        <View style={styles.calendarBody}>
          <CalendarMonthPager
            baseMonth={baseMonth}
            monthOffset={monthOffset}
            today={today}
            selectedDate={selectedDate}
            pageWidth={PAGE_WIDTH}
            onSelectDate={handleSelectDate}
            onSwipeMonthStart={handleSwipeMonthStart}
            onSwipeMonthComplete={handleSwipeMonthComplete}
          />
        </View>
      </View>

      <View style={styles.belowCalendar}>
        <View style={styles.jumpToTodayRow}>
          {showJumpToToday && <JumpToTodayButton onPress={handleJumpToToday} />}
        </View>

        <SelectedDayDetail
          selectedDate={selectedDate}
          schedules={daySchedules}
          onSchedulePress={onSchedulePress}
        />
      </View>

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
  belowCalendar: {
    marginTop: spacing.xs,
  },
  jumpToTodayRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 36,
    paddingRight: spacing.xs,
  },
});
