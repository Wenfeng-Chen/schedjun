import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CustomReminderConfig,
  MAX_REMINDER_VALUE,
  REMINDER_TIME_UNITS,
  ReminderTimeUnit,
} from '../../constants/reminderConfig';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatCustomReminderLabel } from '../../utils/reminderUtils';

interface CustomReminderModalProps {
  visible: boolean;
  value: CustomReminderConfig;
  onConfirm: (value: CustomReminderConfig) => void;
  onClose: () => void;
}

const VALUE_OPTIONS = Array.from({ length: MAX_REMINDER_VALUE }, (_, index) => index + 1);

export default function CustomReminderModal({
  visible,
  value,
  onConfirm,
  onClose,
}: CustomReminderModalProps) {
  const [draftValue, setDraftValue] = useState(value.value);
  const [draftUnit, setDraftUnit] = useState<ReminderTimeUnit>(value.unit);

  useEffect(() => {
    if (visible) {
      setDraftValue(value.value);
      setDraftUnit(value.unit);
    }
  }, [visible, value]);

  const preview = useMemo(
    () => formatCustomReminderLabel({ value: draftValue, unit: draftUnit }),
    [draftValue, draftUnit],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>自定义</Text>
          <Text style={styles.preview}>{preview}</Text>

          <View style={styles.pickerRow}>
            <ScrollView style={styles.column} bounces={false} showsVerticalScrollIndicator={false}>
              {VALUE_OPTIONS.map((option) => {
                const isSelected = option === draftValue;
                return (
                  <Pressable
                    key={option}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => setDraftValue(option)}
                  >
                    <Text
                      style={[styles.pickerValue, isSelected && styles.pickerValueSelected]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView style={styles.column} bounces={false} showsVerticalScrollIndicator={false}>
              {REMINDER_TIME_UNITS.map((option) => {
                const isSelected = option.value === draftUnit;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => setDraftUnit(option.value)}
                  >
                    <Text
                      style={[styles.pickerUnit, isSelected && styles.pickerUnitSelected]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                onConfirm({ value: draftValue, unit: draftUnit });
                onClose();
              }}
            >
              <Text style={styles.confirmText}>确定</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.menuOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  preview: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 160,
    marginBottom: spacing.lg,
  },
  column: {
    flex: 1,
  },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pickerItemSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  pickerValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: colors.textSecondary,
  },
  pickerValueSelected: {
    fontSize: 28,
    color: colors.primary,
  },
  pickerUnit: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  pickerUnitSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
