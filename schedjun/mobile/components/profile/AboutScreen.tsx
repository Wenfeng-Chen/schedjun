import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';

interface AboutScreenProps {
  onClose: () => void;
}

export default function AboutScreen({ onClose }: AboutScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>关于日程君</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Ionicons name="calendar" size={56} color={colors.primary} />
        </View>
        <Text style={styles.appName}>日程君</Text>
        <Text style={styles.appSubtitle}>Schedjun</Text>
        <Text style={styles.tagline}>让安排更简单</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>版本</Text>
            <Text style={styles.infoValue}>v1.0.0</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>语音助手</Text>
            <Text style={styles.infoValue}>君听</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>数据存储</Text>
            <Text style={styles.infoValue}>本地优先</Text>
          </View>
        </View>

        <Text style={styles.description}>
          日程君是一款智能日程管理应用，通过自然语言对话帮你快速创建、查询、修改和删除日程。搭配"君听"语音助手，说出你的计划，即可轻松安排每一天。
        </Text>

        <Text style={styles.copyright}>
          © 2026 Schedjun · 日程君
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backgroundWarm,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
  },
  appSubtitle: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  tagline: {
    marginTop: spacing.sm,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
  infoCard: {
    width: '100%',
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
  description: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  copyright: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
