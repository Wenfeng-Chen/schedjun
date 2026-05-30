import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { MAX_REPEAT_INTERVAL } from '../../constants/repeatConfig';
import { colors, radius, spacing } from '../../constants/theme';
import { getFrequencyLabel, getIntervalTitle } from '../../utils/repeatUtils';

interface IntervalPickerModalProps {
  visible: boolean;
  frequency: 'day' | 'week' | 'month' | 'year';
  value: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
}

const INTERVAL_OPTIONS = Array.from({ length: MAX_REPEAT_INTERVAL }, (_, index) => index + 1);

export default function IntervalPickerModal({
  visible,
  frequency,
  value,
  onConfirm,
  onClose,
}: IntervalPickerModalProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const unit = getFrequencyLabel(frequency);
  const title = getIntervalTitle(frequency);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.list} bounces={false}>
            {INTERVAL_OPTIONS.map((option) => {
              const isSelected = option === draft;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => setDraft(option)}
                >
                  <Text style={[styles.optionNumber, isSelected && styles.optionNumberSelected]}>
                    {option}
                  </Text>
                  <Text style={[styles.optionUnit, isSelected && styles.optionUnitSelected]}>
                    {unit}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  list: {
    maxHeight: 280,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: colors.textSecondary,
  },
  optionNumberSelected: {
    color: colors.primary,
    fontSize: 28,
  },
  optionUnit: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  optionUnitSelected: {
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCool,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
