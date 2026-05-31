import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScheduleItem } from '../../constants/scheduleTypes';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatSelectedDate } from '../../utils/calendarUtils';
import { formatScheduleTime } from '../../utils/scheduleUtils';

interface SelectedDayDetailProps {
  selectedDate: Date;
  schedules: ScheduleItem[];
  onSchedulePress?: (scheduleId: string) => void;
}

export default function SelectedDayDetail({
  selectedDate,
  schedules,
  onSchedulePress,
}: SelectedDayDetailProps) {
  const formatted = formatSelectedDate(selectedDate);

  return (
    <View style={styles.container}>
      <Text style={styles.dateLine}>
        {formatted.main} · {formatted.weekday} · {formatted.year}
      </Text>

      {schedules.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>暂无日程</Text>
          <Text style={styles.emptyHint}>语音添加后将显示在这里</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {schedules.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.scheduleRow, index < schedules.length - 1 && styles.scheduleRowBorder]}
              onPress={() => onSchedulePress?.(item.id)}
            >
              <View style={styles.scheduleDot} />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.scheduleTime}>
                  {formatScheduleTime(item.startTime, item.endTime)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xs,
  },
  dateLine: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  emptyHint: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  scheduleRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  scheduleTime: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
