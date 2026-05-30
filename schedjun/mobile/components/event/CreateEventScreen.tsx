import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { DEFAULT_REMINDER_RULE, ReminderRule } from '../../constants/reminderConfig';
import { DEFAULT_REPEAT_RULE, RepeatRule } from '../../constants/repeatConfig';
import { colors, spacing } from '../../constants/theme';
import { createDefaultEventTimes, formatEventDateTime } from '../../utils/dateFormatUtils';
import {
  createDefaultCustomRepeat,
  formatRepeatLabel,
} from '../../utils/repeatUtils';
import { formatReminderLabel } from '../../utils/reminderUtils';
import CustomRepeatScreen from './CustomRepeatScreen';
import DateTimePickerModal from './DateTimePickerModal';
import FormRow from './FormRow';
import FormSection from './FormSection';
import ReminderPickerScreen from './ReminderPickerScreen';
import RepeatPickerScreen from './RepeatPickerScreen';

export interface EventFormData {
  title: string;
  startTime: Date;
  endTime: Date;
  repeat: RepeatRule;
  reminder: ReminderRule;
  notes: string;
}

interface CreateEventScreenProps {
  initialDate: Date;
  onClose: () => void;
  onSave?: (data: EventFormData) => void;
}

type PickerTarget = 'start' | 'end' | null;
type EventSubScreen = 'form' | 'repeat' | 'customRepeat' | 'reminder';

export default function CreateEventScreen({
  initialDate,
  onClose,
  onSave,
}: CreateEventScreenProps) {
  const defaultTimes = useMemo(() => createDefaultEventTimes(initialDate), [initialDate]);

  const [subScreen, setSubScreen] = useState<EventSubScreen>('form');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(defaultTimes.start);
  const [endTime, setEndTime] = useState(defaultTimes.end);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(DEFAULT_REPEAT_RULE);
  const [reminderRule, setReminderRule] = useState<ReminderRule>(DEFAULT_REMINDER_RULE);
  const [notes, setNotes] = useState('');

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const handleDateTimeConfirm = (selected: Date): boolean => {
    if (pickerTarget === 'start') {
      setStartTime(selected);
      if (selected >= endTime) {
        const adjustedEnd = new Date(selected);
        adjustedEnd.setHours(selected.getHours() + 1);
        setEndTime(adjustedEnd);
      }
      return true;
    }

    if (selected <= startTime) {
      Alert.alert('提示', '结束时间需晚于开始时间');
      return false;
    }

    setEndTime(selected);
    return true;
  };

  const openDateTimePicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('提示', '请输入日程内容');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('提示', '结束时间需晚于开始时间');
      return;
    }

    onSave?.({
      title: trimmedTitle,
      startTime,
      endTime,
      repeat: repeatRule,
      reminder: reminderRule,
      notes: notes.trim(),
    });
    onClose();
  };

  if (subScreen === 'repeat') {
    return (
      <RepeatPickerScreen
        value={repeatRule}
        onBack={() => setSubScreen('form')}
        onSelect={(rule) => {
          setRepeatRule(rule);
          setSubScreen('form');
        }}
        onCustom={() => setSubScreen('customRepeat')}
      />
    );
  }

  if (subScreen === 'reminder') {
    return (
      <ReminderPickerScreen
        value={reminderRule}
        onBack={(rule) => {
          setReminderRule(rule);
          setSubScreen('form');
        }}
      />
    );
  }

  if (subScreen === 'customRepeat') {
    return (
      <CustomRepeatScreen
        value={repeatRule.custom ?? createDefaultCustomRepeat(startTime)}
        startTime={startTime}
        onBack={(custom) => {
          setRepeatRule({ preset: 'custom', custom });
          setSubScreen('repeat');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>创建日程</Text>
        <Pressable style={styles.headerButton} onPress={handleSave} hitSlop={8}>
          <Ionicons name="checkmark" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection>
            <TextInput
              style={styles.titleInput}
              placeholder="试着输入「明天14:00开会」"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              multiline
            />
          </FormSection>

          <FormSection>
            <FormRow
              label="开始时间"
              value={formatEventDateTime(startTime)}
              onPress={() => openDateTimePicker('start')}
            />
            <FormRow
              label="结束时间"
              value={formatEventDateTime(endTime)}
              isLast
              onPress={() => openDateTimePicker('end')}
            />
          </FormSection>

          <FormSection>
            <FormRow
              label="重复"
              value={formatRepeatLabel(repeatRule)}
              onPress={() => setSubScreen('repeat')}
            />
            <FormRow
              label="提醒"
              value={formatReminderLabel(reminderRule)}
              isLast
              onPress={() => setSubScreen('reminder')}
            />
          </FormSection>

          <FormSection>
            <TextInput
              style={styles.notesInput}
              placeholder="请输入备注"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </FormSection>
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? '开始时间' : '结束时间'}
        value={pickerTarget === 'start' ? startTime : endTime}
        onConfirm={handleDateTimeConfirm}
        onClose={() => setPickerTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleInput: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
    lineHeight: 24,
  },
  notesInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    lineHeight: 22,
  },
});
