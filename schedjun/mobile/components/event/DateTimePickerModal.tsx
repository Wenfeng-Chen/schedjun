import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import {
  buildDateTime,
  findDateOptionIndex,
  formatEventDateTime,
  formatPickerDateLabel,
  generateDateOptions,
} from '../../utils/dateFormatUtils';
import WheelColumn, { wheelStyles } from './WheelColumn';

interface DateTimePickerModalProps {
  visible: boolean;
  title: string;
  value: Date;
  onConfirm: (value: Date) => void | boolean;
  onClose: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => `${index}`);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  index.toString().padStart(2, '0'),
);

export default function DateTimePickerModal({
  visible,
  title,
  value,
  onConfirm,
  onClose,
}: DateTimePickerModalProps) {
  const dateOptions = useMemo(() => generateDateOptions(value), [value]);

  const [dateIndex, setDateIndex] = useState(() => findDateOptionIndex(dateOptions, value));
  const [hourIndex, setHourIndex] = useState(value.getHours());
  const [minuteIndex, setMinuteIndex] = useState(value.getMinutes());

  useEffect(() => {
    if (visible) {
      setDateIndex(findDateOptionIndex(dateOptions, value));
      setHourIndex(value.getHours());
      setMinuteIndex(value.getMinutes());
    }
  }, [visible, value, dateOptions]);

  const draftValue = useMemo(
    () => buildDateTime(dateOptions[dateIndex] ?? value, hourIndex, minuteIndex),
    [dateIndex, dateOptions, hourIndex, minuteIndex, value],
  );

  const dateLabels = useMemo(
    () => dateOptions.map((item) => formatPickerDateLabel(item)),
    [dateOptions],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview}>{formatEventDateTime(draftValue)}</Text>

          <View style={wheelStyles.frame}>
            <View style={wheelStyles.highlight} />
            <WheelColumn
              items={dateLabels}
              selectedIndex={dateIndex}
              onSelect={setDateIndex}
              width="46%"
            />
            <WheelColumn
              items={HOUR_OPTIONS}
              selectedIndex={hourIndex}
              onSelect={setHourIndex}
              activeSuffix="时"
              width="27%"
            />
            <WheelColumn
              items={MINUTE_OPTIONS}
              selectedIndex={minuteIndex}
              onSelect={setMinuteIndex}
              activeSuffix="分"
              width="27%"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                const shouldClose = onConfirm(draftValue);
                if (shouldClose !== false) {
                  onClose();
                }
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
    paddingHorizontal: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
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
    fontSize: 15,
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
