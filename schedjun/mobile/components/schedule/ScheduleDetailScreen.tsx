import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleItem } from '../../constants/scheduleTypes';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatScheduleDetailSubtitle } from '../../utils/scheduleDetailUtils';
import { formatReminderLabel } from '../../utils/reminderUtils';
import { formatRepeatLabel } from '../../utils/repeatUtils';

interface ScheduleDetailScreenProps {
  schedule: ScheduleItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const NOTES_PREVIEW_LINES = 4;

function DetailRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <Pressable style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function ScheduleDetailScreen({
  schedule,
  onClose,
  onEdit,
  onDelete,
}: ScheduleDetailScreenProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [notesExpanded, setNotesExpanded] = useState(false);

  const noteLines = useMemo(
    () => schedule.notes.split('\n').filter((line) => line.trim().length > 0),
    [schedule.notes],
  );
  const hasMoreNotes = noteLines.length > NOTES_PREVIEW_LINES;
  const visibleNotes = notesExpanded ? schedule.notes : noteLines.slice(0, NOTES_PREVIEW_LINES).join('\n');
  const bodyScrollable = notesExpanded && noteLines.length > NOTES_PREVIEW_LINES;

  const handleDelete = () => {
    Alert.alert('删除日程', '确定删除这条日程？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.sheet}>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>

            <View style={[styles.card, { maxHeight: windowHeight * 0.68 }]}>
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>{schedule.title}</Text>
                <Text style={styles.heroSubtitle}>{formatScheduleDetailSubtitle(schedule)}</Text>
              </View>

              <ScrollView
                style={bodyScrollable ? styles.bodyScroll : undefined}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={bodyScrollable}
                scrollEnabled={bodyScrollable}
                bounces={bodyScrollable}
              >
                <View style={styles.notesSection}>
                  <View style={styles.notesHeader}>
                    <Text style={styles.notesLabel}>备注</Text>
                    {hasMoreNotes && !notesExpanded && (
                      <Pressable onPress={() => setNotesExpanded(true)}>
                        <Text style={styles.moreLink}>更多</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.notesText}>
                    {schedule.notes.trim() ? visibleNotes : '无'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <DetailRow label="提醒" value={formatReminderLabel(schedule.reminder)} />
                <DetailRow label="重复" value={formatRepeatLabel(schedule.repeat)} isLast />
              </ScrollView>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="create-outline" size={22} color={colors.text} />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.menuOverlay,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    flex: 1,
    justifyContent: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    flexGrow: 0,
  },
  notesSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  notesLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  moreLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  detailValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '58%',
  },
  detailValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
});
