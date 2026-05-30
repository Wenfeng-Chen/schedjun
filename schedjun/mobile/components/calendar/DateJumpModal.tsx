import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import {
  DATE_JUMP_YEAR_START,
  buildJumpDate,
  clampDayForMonth,
  formatJumpDatePreview,
  generateDayOptions,
  generateMonthOptions,
  generateYearOptions,
} from '../../utils/dateJumpUtils';
import WheelColumn, { wheelStyles } from '../event/WheelColumn';

interface DateJumpModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (value: Date) => void;
  onClose: () => void;
}

const YEAR_OPTIONS = generateYearOptions();
const MONTH_OPTIONS = generateMonthOptions();

export default function DateJumpModal({
  visible,
  value,
  onConfirm,
  onClose,
}: DateJumpModalProps) {
  const [yearIndex, setYearIndex] = useState(value.getFullYear() - DATE_JUMP_YEAR_START);
  const [monthIndex, setMonthIndex] = useState(value.getMonth());
  const [dayIndex, setDayIndex] = useState(value.getDate() - 1);

  const year = DATE_JUMP_YEAR_START + yearIndex;
  const month = monthIndex + 1;

  const dayOptions = useMemo(() => generateDayOptions(year, month), [year, month]);

  useEffect(() => {
    if (visible) {
      setYearIndex(value.getFullYear() - DATE_JUMP_YEAR_START);
      setMonthIndex(value.getMonth());
      setDayIndex(value.getDate() - 1);
    }
  }, [visible, value]);

  useEffect(() => {
    setDayIndex((prev) => Math.min(prev, dayOptions.length - 1));
  }, [dayOptions.length]);

  const draftDate = useMemo(
    () => buildJumpDate(year, month, clampDayForMonth(year, month, dayIndex + 1)),
    [year, month, dayIndex],
  );

  const handleYearSelect = (index: number) => {
    setYearIndex(index);
    const nextYear = DATE_JUMP_YEAR_START + index;
    setDayIndex((prev) => clampDayForMonth(nextYear, monthIndex + 1, prev + 1) - 1);
  };

  const handleMonthSelect = (index: number) => {
    setMonthIndex(index);
    setDayIndex((prev) => clampDayForMonth(year, index + 1, prev + 1) - 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>选择日期</Text>
          <Text style={styles.preview}>{formatJumpDatePreview(draftDate)}</Text>

          <View style={wheelStyles.frame}>
            <View style={wheelStyles.highlight} />
            <WheelColumn
              items={YEAR_OPTIONS}
              selectedIndex={yearIndex}
              onSelect={handleYearSelect}
              activeSuffix="年"
              width="34%"
            />
            <WheelColumn
              items={MONTH_OPTIONS}
              selectedIndex={monthIndex}
              onSelect={handleMonthSelect}
              activeSuffix="月"
              width="33%"
            />
            <WheelColumn
              items={dayOptions}
              selectedIndex={dayIndex}
              onSelect={setDayIndex}
              activeSuffix="日"
              width="33%"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                onConfirm(draftDate);
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
