import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';

interface FormSectionProps {
  children: ReactNode;
}

export default function FormSection({ children }: FormSectionProps) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
});
