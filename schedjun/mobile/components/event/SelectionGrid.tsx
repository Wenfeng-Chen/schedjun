import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';

interface SelectionGridItem {
  value: number;
  label: string;
}

interface SelectionGridProps {
  items: SelectionGridItem[];
  selected: number[];
  columns?: number;
  onToggle: (value: number) => void;
}

export default function SelectionGrid({
  items,
  selected,
  columns = 4,
  onToggle,
}: SelectionGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const isSelected = selected.includes(item.value);
        return (
          <Pressable
            key={item.value}
            style={[styles.cell, { width: `${100 / columns}%` }]}
            onPress={() => onToggle(item.value)}
          >
            <View style={[styles.chip, isSelected && styles.chipSelected]}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemiBold,
  },
});
