import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { REMINDER_PRESETS, ReminderRule } from '../../constants/reminderConfig';
import { fonts } from '../../constants/fonts';
import { colors, spacing } from '../../constants/theme';
import { createDefaultCustomReminder } from '../../utils/reminderUtils';
import CustomReminderModal from './CustomReminderModal';
import FormSection from './FormSection';
import SubScreenHeader from './SubScreenHeader';

interface ReminderPickerScreenProps {
  value: ReminderRule;
  onBack: (rule: ReminderRule) => void;
}

export default function ReminderPickerScreen({ value, onBack }: ReminderPickerScreenProps) {
  const [rule, setRule] = useState<ReminderRule>(value);
  const [customModalVisible, setCustomModalVisible] = useState(false);

  const isCustomSelected = rule.enabled && rule.preset === 'custom';

  const handleToggle = (enabled: boolean) => {
    if (!enabled) {
      setRule({ enabled: false, preset: 'none' });
      return;
    }

    setRule((current) =>
      current.enabled ? current : { enabled: true, preset: 'atStart' },
    );
  };

  const handlePresetSelect = (preset: (typeof REMINDER_PRESETS)[number]['id']) => {
    setRule({ enabled: true, preset });
  };

  const handleCustomConfirm = (custom: NonNullable<ReminderRule['custom']>) => {
    setRule({ enabled: true, preset: 'custom', custom });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SubScreenHeader title="提醒设置" onBack={() => onBack(rule)} />

      <ScrollView contentContainerStyle={styles.content}>
        <FormSection>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>提醒</Text>
            <Switch
              value={rule.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={rule.enabled ? colors.primary : colors.surface}
            />
          </View>
        </FormSection>

        {rule.enabled && (
          <>
            <FormSection>
              {REMINDER_PRESETS.map((preset, index) => {
                const isSelected = rule.preset === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    style={[
                      styles.row,
                      index < REMINDER_PRESETS.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => handlePresetSelect(preset.id)}
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
              <Pressable style={styles.row} onPress={() => setCustomModalVisible(true)}>
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
          </>
        )}
      </ScrollView>

      <CustomReminderModal
        visible={customModalVisible}
        value={rule.custom ?? createDefaultCustomReminder()}
        onConfirm={handleCustomConfirm}
        onClose={() => setCustomModalVisible(false)}
      />
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  toggleLabel: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
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
