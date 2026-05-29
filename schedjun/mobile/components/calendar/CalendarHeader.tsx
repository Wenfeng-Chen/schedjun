import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { MonthRef, getMonthTitle } from '../../utils/calendarUtils';

interface CalendarHeaderProps {
  monthRef: MonthRef;
  today: Date;
  onAddPress: () => void;
  onMenuPress: () => void;
}

export default function CalendarHeader({
  monthRef,
  today,
  onAddPress,
  onMenuPress,
}: CalendarHeaderProps) {
  const isCurrentMonth =
    monthRef.year === today.getFullYear() && monthRef.month === today.getMonth();

  return (
    <View style={styles.container}>
      <View style={styles.titleGroup}>
        <Text style={styles.monthTitle}>{getMonthTitle(monthRef, today)}</Text>
        {isCurrentMonth && <Text style={styles.subtitle}>本月</Text>}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onAddPress} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.primaryDark} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onMenuPress} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  monthTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
