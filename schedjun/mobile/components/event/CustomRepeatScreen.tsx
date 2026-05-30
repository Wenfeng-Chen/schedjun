import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CustomRepeatConfig,
  FREQUENCY_OPTIONS,
  MonthRepeatMode,
  RepeatFrequency,
  WEEKDAY_OPTIONS,
} from '../../constants/repeatConfig';
import { fonts } from '../../constants/fonts';
import { colors, spacing } from '../../constants/theme';
import {
  formatCustomRepeatSummary,
  getFrequencyLabel,
} from '../../utils/repeatUtils';
import FormRow from './FormRow';
import FormSection from './FormSection';
import IntervalPickerModal from './IntervalPickerModal';
import OptionPickerModal from './OptionPickerModal';
import SelectionGrid from './SelectionGrid';
import SubScreenHeader from './SubScreenHeader';

interface CustomRepeatScreenProps {
  value: CustomRepeatConfig;
  startTime: Date;
  onBack: (value: CustomRepeatConfig) => void;
}

const MONTH_DAY_ITEMS = Array.from({ length: 31 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1}`,
}));

const YEAR_MONTH_ITEMS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1}月`,
}));

export default function CustomRepeatScreen({
  value,
  startTime,
  onBack,
}: CustomRepeatScreenProps) {
  const [config, setConfig] = useState<CustomRepeatConfig>(value);
  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);
  const [intervalPickerVisible, setIntervalPickerVisible] = useState(false);

  const summary = useMemo(
    () => formatCustomRepeatSummary(config, startTime),
    [config, startTime],
  );

  const updateConfig = (patch: Partial<CustomRepeatConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  const handleFrequencyChange = (frequency: RepeatFrequency) => {
    updateConfig({ frequency, interval: 1 });
  };

  const toggleWeekday = (day: number) => {
    const exists = config.weekdays.includes(day);
    const weekdays = exists
      ? config.weekdays.filter((item) => item !== day)
      : [...config.weekdays, day];
    updateConfig({ weekdays });
  };

  const toggleMonthDay = (day: number) => {
    const exists = config.monthDays.includes(day);
    const monthDays = exists
      ? config.monthDays.filter((item) => item !== day)
      : [...config.monthDays, day];
    updateConfig({ monthDays });
  };

  const toggleYearMonth = (month: number) => {
    const exists = config.yearMonths.includes(month);
    const yearMonths = exists
      ? config.yearMonths.filter((item) => item !== month)
      : [...config.yearMonths, month];
    updateConfig({ yearMonths });
  };

  const renderMonthModeToggle = () => (
    <View style={styles.modeRow}>
      {(['date', 'weekday'] as MonthRepeatMode[]).map((mode) => {
        const isActive = config.monthMode === mode;
        const label = mode === 'date' ? '日期' : '星期';
        return (
          <Pressable
            key={mode}
            style={styles.modeItem}
            onPress={() => updateConfig({ monthMode: mode })}
          >
            <Text style={[styles.modeText, isActive && styles.modeTextActive]}>{label}</Text>
            {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
          </Pressable>
        );
      })}
    </View>
  );

  const renderSelectionArea = () => {
    switch (config.frequency) {
      case 'week':
        return (
          <>
            <Text style={styles.sectionHint}>选择提醒时间</Text>
            <FormSection>
              <SelectionGrid
                items={WEEKDAY_OPTIONS}
                selected={config.weekdays}
                columns={4}
                onToggle={toggleWeekday}
              />
            </FormSection>
          </>
        );
      case 'month':
        return (
          <>
            <Text style={styles.sectionHint}>选择提醒时间</Text>
            <FormSection>{renderMonthModeToggle()}</FormSection>
            <Text style={styles.sectionHint}>
              {config.monthMode === 'date' ? '选择日期' : '选择星期'}
            </Text>
            <FormSection>
              {config.monthMode === 'date' ? (
                <SelectionGrid
                  items={MONTH_DAY_ITEMS}
                  selected={config.monthDays}
                  columns={7}
                  onToggle={toggleMonthDay}
                />
              ) : (
                <SelectionGrid
                  items={WEEKDAY_OPTIONS}
                  selected={config.weekdays}
                  columns={4}
                  onToggle={toggleWeekday}
                />
              )}
            </FormSection>
          </>
        );
      case 'year':
        return (
          <>
            <Text style={styles.sectionHint}>选择月份</Text>
            <FormSection>
              <SelectionGrid
                items={YEAR_MONTH_ITEMS}
                selected={config.yearMonths}
                columns={4}
                onToggle={toggleYearMonth}
              />
            </FormSection>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SubScreenHeader title="自定义重复" onBack={() => onBack(config)} />

      <ScrollView contentContainerStyle={styles.content}>
        <FormSection>
          <FormRow
            label="频率"
            value={getFrequencyLabel(config.frequency)}
            onPress={() => setFrequencyPickerVisible(true)}
          />
          <FormRow
            label="每"
            value={`${config.interval}${getFrequencyLabel(config.frequency)}`}
            isLast
            onPress={() => setIntervalPickerVisible(true)}
          />
        </FormSection>

        <Text style={styles.summary}>{summary}</Text>

        {renderSelectionArea()}
      </ScrollView>

      <OptionPickerModal
        visible={frequencyPickerVisible}
        title="频率"
        options={FREQUENCY_OPTIONS.map((item) => item.label)}
        selected={getFrequencyLabel(config.frequency)}
        onSelect={(label) => {
          const frequency = FREQUENCY_OPTIONS.find((item) => item.label === label)?.value;
          if (frequency) {
            handleFrequencyChange(frequency);
          }
        }}
        onClose={() => setFrequencyPickerVisible(false)}
      />

      <IntervalPickerModal
        visible={intervalPickerVisible}
        frequency={config.frequency}
        value={config.interval}
        onConfirm={(interval) => updateConfig({ interval })}
        onClose={() => setIntervalPickerVisible(false)}
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
    paddingBottom: spacing.xl,
  },
  summary: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  sectionHint: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xl,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  modeText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
  },
});
