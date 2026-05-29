import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';

interface CalendarMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS = ['我的日程', '日期跳转'];

export default function CalendarMenu({ visible, onClose }: CalendarMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((label, index) => (
              <Pressable
                key={label}
                style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
                onPress={() => undefined}
              >
                <Text style={styles.menuText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.menuOverlay,
  },
  menuContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: spacing.lg,
  },
  menuCard: {
    minWidth: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
});
