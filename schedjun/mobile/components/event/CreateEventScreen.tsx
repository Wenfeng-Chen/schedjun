import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';import {
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
import { REMINDER_OPTIONS, REPEAT_OPTIONS } from '../../constants/eventOptions';
import { colors, radius, spacing } from '../../constants/theme';
import { createDefaultEventTimes, formatEventDateTime } from '../../utils/dateFormatUtils';
import FormRow from './FormRow';
import FormSection from './FormSection';
import OptionPickerModal from './OptionPickerModal';

export interface EventFormData {
  title: string;
  startTime: Date;
  endTime: Date;
  repeat: string;
  reminder: string;
  notes: string;
}

interface CreateEventScreenProps {
  initialDate: Date;
  onClose: () => void;
  onSave?: (data: EventFormData) => void;
}

type PickerTarget = 'start' | 'end' | null;
type OptionTarget = 'repeat' | 'reminder' | null;

export default function CreateEventScreen({
  initialDate,
  onClose,
  onSave,
}: CreateEventScreenProps) {
  const defaultTimes = useMemo(() => createDefaultEventTimes(initialDate), [initialDate]);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(defaultTimes.start);
  const [endTime, setEndTime] = useState(defaultTimes.end);
  const [repeat, setRepeat] = useState<string>(REPEAT_OPTIONS[0]);
  const [reminder, setReminder] = useState<string>(REMINDER_OPTIONS[1]);
  const [notes, setNotes] = useState('');

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [tempPickerValue, setTempPickerValue] = useState<Date>(new Date());
  const [optionTarget, setOptionTarget] = useState<OptionTarget>(null);

  const applyPickerResult = (target: 'start' | 'end', selected: Date) => {
    if (target === 'start') {
      setStartTime(selected);
      if (selected >= endTime) {
        const adjustedEnd = new Date(selected);
        adjustedEnd.setHours(selected.getHours() + 1);
        setEndTime(adjustedEnd);
      }
      return;
    }

    if (selected <= startTime) {
      Alert.alert('提示', '结束时间需晚于开始时间');
      return;
    }
    setEndTime(selected);
  };

  const openAndroidDateTimePicker = (target: 'start' | 'end', current: Date) => {
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      onValueChange: (_event, selectedDate) => {
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_timeEvent, selectedTime) => {
            applyPickerResult(target, selectedTime);
          },
        });
      },
    });
  };

  const openDateTimePicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? startTime : endTime;

    if (Platform.OS === 'android') {
      openAndroidDateTimePicker(target, current);
      return;
    }

    setTempPickerValue(current);
    setPickerTarget(target);
  };

  const handleIosPickerConfirm = () => {
    if (pickerTarget) {
      applyPickerResult(pickerTarget, tempPickerValue);
    }
    setPickerTarget(null);
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
      repeat,
      reminder,
      notes: notes.trim(),
    });
    onClose();
  };

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
              onPress={() => openDateTimePicker('end')}            />
          </FormSection>

          <FormSection>
            <FormRow
              label="重复"
              value={repeat}
              onPress={() => setOptionTarget('repeat')}
            />
            <FormRow
              label="提醒"
              value={reminder}
              isLast
              onPress={() => setOptionTarget('reminder')}
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

      {pickerTarget && Platform.OS === 'ios' && (
        <View style={styles.iosPickerSheet}>
          <View style={styles.iosPickerHeader}>
            <Pressable onPress={() => setPickerTarget(null)}>
              <Text style={styles.iosPickerAction}>取消</Text>
            </Pressable>
            <Text style={styles.iosPickerTitle}>
              {pickerTarget === 'start' ? '开始时间' : '结束时间'}
            </Text>
            <Pressable onPress={handleIosPickerConfirm}>
              <Text style={[styles.iosPickerAction, styles.iosPickerConfirm]}>完成</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={tempPickerValue}
            mode="datetime"
            display="spinner"
            locale="zh-CN"
            onValueChange={(_event, date) => setTempPickerValue(date)}
          />
        </View>
      )}
      <OptionPickerModal
        visible={optionTarget === 'repeat'}
        title="重复"
        options={REPEAT_OPTIONS}
        selected={repeat}
        onSelect={setRepeat}
        onClose={() => setOptionTarget(null)}
      />

      <OptionPickerModal
        visible={optionTarget === 'reminder'}
        title="提醒"
        options={REMINDER_OPTIONS}
        selected={reminder}
        onSelect={setReminder}
        onClose={() => setOptionTarget(null)}
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
  iosPickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.md,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iosPickerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  iosPickerAction: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  iosPickerConfirm: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
  },
});
