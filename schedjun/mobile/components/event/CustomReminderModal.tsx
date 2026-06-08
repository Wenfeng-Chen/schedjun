import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CustomReminderConfig,
  MAX_REMINDER_VALUE,
  REMINDER_TIME_UNITS,
  ReminderTimeUnit,
} from '../../constants/reminderConfig';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatCustomReminderLabel } from '../../utils/reminderUtils';
import WheelColumn, { wheelStyles } from './WheelColumn';

interface CustomReminderModalProps {
  visible: boolean;
  value: CustomReminderConfig;
  onConfirm: (value: CustomReminderConfig) => void;
  onClose: () => void;
}

const VALUE_OPTIONS = Array.from({ length: MAX_REMINDER_VALUE }, (_, index) => String(index + 1));
const UNIT_OPTIONS = REMINDER_TIME_UNITS.map((option) => option.label);

function unitIndexFromValue(unit: ReminderTimeUnit): number {
  const index = REMINDER_TIME_UNITS.findIndex((option) => option.value === unit);
  return index >= 0 ? index : 0;
}

export default function CustomReminderModal({
  visible,
  value,
  onConfirm,
  onClose,
}: CustomReminderModalProps) {
  const [valueIndex, setValueIndex] = useState(value.value - 1);
  const [unitIndex, setUnitIndex] = useState(unitIndexFromValue(value.unit));

  useEffect(() => {
    if (visible) {
      setValueIndex(value.value - 1);
      setUnitIndex(unitIndexFromValue(value.unit));
    }
  }, [visible, value]);

  const draft = useMemo(
    () => ({
      value: valueIndex + 1,
      unit: REMINDER_TIME_UNITS[unitIndex].value,
    }),
    [unitIndex, valueIndex],
  );

  const preview = useMemo(() => formatCustomReminderLabel(draft), [draft]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>自定义</Text>
          <Text style={styles.preview}>{preview}</Text>

          <View style={wheelStyles.frame}>
            <View style={wheelStyles.highlight} />
            <WheelColumn
              items={VALUE_OPTIONS}
              selectedIndex={valueIndex}
              onSelect={setValueIndex}
              width="50%"
            />
            <WheelColumn
              items={UNIT_OPTIONS}
              selectedIndex={unitIndex}
              onSelect={setUnitIndex}
              width="50%"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                onConfirm(draft);
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
