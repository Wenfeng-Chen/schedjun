import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
import { ReminderRule } from '../../constants/reminderConfig';
import { RepeatRule } from '../../constants/repeatConfig';
import { colors, spacing } from '../../constants/theme';
import { formatEventDateTime } from '../../utils/dateFormatUtils';
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

export interface EditEventFormData {
  title: string;
  startTime: Date;
  endTime: Date;
  repeat: RepeatRule;
  reminder: ReminderRule;
  notes: string;
  allDay: boolean;
}

interface EditEventScreenProps {
  initialData: EditEventFormData;
  onClose: () => void;
  onSave: (data: EditEventFormData) => void;
}

type PickerTarget = 'start' | 'end' | null;
type EventSubScreen = 'form' | 'repeat' | 'customRepeat' | 'reminder';

export default function EditEventScreen({
  initialData,
  onClose,
  onSave,
}: EditEventScreenProps) {
  const [subScreen, setSubScreen] = useState<EventSubScreen>('form');
  const [title, setTitle] = useState(initialData.title);
  const [startTime, setStartTime] = useState(initialData.startTime);
  const [endTime, setEndTime] = useState(initialData.endTime);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(initialData.repeat);
  const [reminderRule, setReminderRule] = useState<ReminderRule>(initialData.reminder);
  const [notes, setNotes] = useState(initialData.notes);
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

    onSave({
      title: trimmedTitle,
      startTime,
      endTime,
      repeat: repeatRule,
      reminder: reminderRule,
      notes: notes.trim(),
      allDay: initialData.allDay,
    });
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
        <Pressable style={styles.headerButton} onPress={handleSave} hitSlop={8}>
          <Ionicons name="checkmark" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>编辑日程</Text>

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
            <View style={styles.titleRow}>
              <TextInput
                style={styles.titleInput}
                placeholder="请输入日程标题"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                multiline
              />
              {title.length > 0 && (
                <Pressable style={styles.clearButton} onPress={() => setTitle('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </FormSection>

          <FormSection>
            <FormRow
              label="开始时间"
              value={formatEventDateTime(startTime)}
              onPress={() => setPickerTarget('start')}
            />
            <FormRow
              label="结束时间"
              value={formatEventDateTime(endTime)}
              isLast
              onPress={() => setPickerTarget('end')}
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
    paddingTop: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.text,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: spacing.sm,
  },
  titleInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
    lineHeight: 24,
  },
  clearButton: {
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  notesInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 120,
    lineHeight: 22,
  },
});
