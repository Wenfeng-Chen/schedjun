import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { fonts } from '../../constants/fonts';
import { colors } from '../../constants/theme';
import {
  CalendarDay,
  WEEKDAY_LABELS,
  buildCalendarDays,
  formatDayKey,
  MonthRef,
} from '../../utils/calendarUtils';

const GRID_PADDING = 12;

interface CalendarGridProps {
  monthRef: MonthRef;
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  gridWidth: number;
  monthKey: string;
  disableEnterAnimation?: boolean;
}

export default memo(CalendarGrid, (prev: CalendarGridProps, next: CalendarGridProps) => {
  return (
    prev.monthRef.year === next.monthRef.year &&
    prev.monthRef.month === next.monthRef.month &&
    prev.gridWidth === next.gridWidth &&
    prev.disableEnterAnimation === next.disableEnterAnimation &&
    prev.today.getTime() === next.today.getTime() &&
    prev.selectedDate.getTime() === next.selectedDate.getTime() &&
    prev.onSelectDate === next.onSelectDate
  );
});

function CalendarGrid({
  monthRef,
  today,
  selectedDate,
  onSelectDate,
  gridWidth,
  disableEnterAnimation = false,
}: CalendarGridProps) {
  const days = buildCalendarDays(monthRef, today);
  const cellSize = Math.floor((gridWidth - GRID_PADDING * 2) / 7);
  const daySize = Math.min(40, cellSize - 6);

  return (
    <View style={[styles.container, { width: gridWidth, paddingHorizontal: GRID_PADDING }]}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={{ width: cellSize, alignItems: 'center' }}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.grid, { width: cellSize * 7 }]}>
        {days.map((item, index) => (
          <DayCell
            key={formatDayKey(item.date)}
            item={item}
            index={index}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            cellSize={cellSize}
            daySize={daySize}
            disableEnterAnimation={disableEnterAnimation}
          />
        ))}
      </View>
    </View>
  );
}

interface DayCellProps {
  item: CalendarDay;
  index: number;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  cellSize: number;
  daySize: number;
  disableEnterAnimation?: boolean;
}

function DayCell({
  item,
  index,
  selectedDate,
  onSelectDate,
  cellSize,
  daySize,
  disableEnterAnimation = false,
}: DayCellProps) {
  const scale = useSharedValue(1);

  const isSelected =
    item.date.getFullYear() === selectedDate.getFullYear() &&
    item.date.getMonth() === selectedDate.getMonth() &&
    item.date.getDate() === selectedDate.getDate();

  const dayColor = !item.isCurrentMonth
    ? colors.textMuted
    : item.isWeekend
      ? colors.weekend
      : colors.text;

  const isToday = item.isToday;
  const isOtherSelected = isSelected && !item.isToday;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const row = Math.floor(index / 7);

  const cellStyle = {
    width: cellSize,
    height: cellSize,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const cellContent = (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      onPress={() => onSelectDate(item.date)}
    >
      <Animated.View
        style={[
          animatedStyle,
          styles.dayInner,
          { width: daySize, height: daySize, borderRadius: daySize / 3 },
          isToday && styles.todayInner,
          isOtherSelected && styles.selectedInner,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            { color: isToday ? colors.surface : dayColor },
            isToday && styles.todayText,
          ]}
        >
          {item.day}
        </Text>
      </Animated.View>
    </Pressable>
  );

  if (disableEnterAnimation) {
    return <View style={cellStyle}>{cellContent}</View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(row * 35).duration(220)}
      style={cellStyle}
    >
      {cellContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayInner: {
    backgroundColor: colors.primaryDark,
  },
  selectedInner: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dayText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
  todayText: {
    fontFamily: fonts.bodyBold,
  },
});
