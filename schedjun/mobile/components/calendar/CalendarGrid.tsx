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
}

export default function CalendarGrid({
  monthRef,
  today,
  selectedDate,
  onSelectDate,
  gridWidth,
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
}

function DayCell({
  item,
  index,
  selectedDate,
  onSelectDate,
  cellSize,
  daySize,
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

  return (
    <Animated.View
      entering={FadeInDown.delay(row * 35).duration(220)}
      style={{
        width: cellSize,
        height: cellSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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
