import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';

export type MainTab = 'calendar' | 'schedules' | 'mine';

interface BottomTabBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const TABS: { id: MainTab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'calendar', label: '日历', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'schedules', label: '日程', icon: 'list-outline', activeIcon: 'list' },
  { id: 'mine', label: '我的', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            hitSlop={4}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={22}
              color={active ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
});

export const TAB_BAR_HEIGHT = 56;
