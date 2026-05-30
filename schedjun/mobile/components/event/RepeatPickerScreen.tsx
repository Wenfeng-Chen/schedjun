import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { REPEAT_PRESETS, RepeatRule } from '../../constants/repeatConfig';
import { colors, spacing } from '../../constants/theme';
import { fonts } from '../../constants/fonts';
import FormSection from './FormSection';
import SubScreenHeader from './SubScreenHeader';

interface RepeatPickerScreenProps {
  value: RepeatRule;
  onBack: () => void;
  onSelect: (rule: RepeatRule) => void;
  onCustom: () => void;
}

export default function RepeatPickerScreen({
  value,
  onBack,
  onSelect,
  onCustom,
}: RepeatPickerScreenProps) {
  const isCustomSelected = value.preset === 'custom';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SubScreenHeader title="重复" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <FormSection>
          {REPEAT_PRESETS.map((preset, index) => {
            const isSelected = value.preset === preset.id;
            return (
              <Pressable
                key={preset.id}
                style={[
                  styles.row,
                  index < REPEAT_PRESETS.length - 1 && styles.rowBorder,
                ]}
                onPress={() => onSelect({ preset: preset.id })}
              >
                <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                  {preset.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
        </FormSection>

        <FormSection>
          <Pressable style={styles.row} onPress={onCustom}>
            <Text style={[styles.rowText, isCustomSelected && styles.rowTextSelected]}>
              自定义
            </Text>
            {isCustomSelected ? (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            )}
          </Pressable>
        </FormSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  content: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  rowTextSelected: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
  },
});
