import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, spacing } from '../../constants/theme';

interface FormRowProps {
  label: string;
  value?: string;
  placeholder?: string;
  showChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export default function FormRow({
  label,
  value,
  placeholder,
  showChevron = true,
  isLast = false,
  onPress,
}: FormRowProps) {
  const displayText = value || placeholder;
  const isPlaceholder = !value && !!placeholder;

  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueGroup}>
        <Text
          style={[styles.value, isPlaceholder && styles.placeholder]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    flexShrink: 0,
    marginRight: spacing.md,
  },
  valueGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    flexShrink: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
});
