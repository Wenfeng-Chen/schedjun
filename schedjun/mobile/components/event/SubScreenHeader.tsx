import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, spacing } from '../../constants/theme';

interface SubScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export default function SubScreenHeader({ title, onBack }: SubScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundWarm,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.text,
    letterSpacing: 0.5,
  },
});
