import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatDayKey, formatSelectedDate, isSameDay } from '../../utils/calendarUtils';

interface SelectedDayDetailProps {
  selectedDate: Date;
  today: Date;
}

export default function SelectedDayDetail({ selectedDate, today }: SelectedDayDetailProps) {
  const formatted = formatSelectedDate(selectedDate);
  const isToday = isSameDay(selectedDate, today);
  const detailKey = formatDayKey(selectedDate);

  return (
    <Animated.View key={detailKey} entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.mainDate}>{formatted.main}</Text>
          <Text style={styles.subDate}>
            {formatted.weekday} · {formatted.year}
          </Text>
        </View>
        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>今天</Text>
          </View>
        )}
      </View>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>暂无日程</Text>
        <Text style={styles.emptyHint}>语音添加后将显示在这里</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  mainDate: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 0.5,
  },
  subDate: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  todayBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.xl,
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
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
});
