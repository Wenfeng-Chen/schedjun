import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import { formatUserCreatedAt } from '../../constants/userTypes';
import { MainTab } from '../navigation/BottomTabBar';
import AboutScreen from './AboutScreen';
import AuthScreen, { AuthMode } from './AuthScreen';
import DefaultAvatar from './DefaultAvatar';

interface MineScreenProps {
  scheduleCount: number;
  bottomInset: number;
  onTabChange?: (tab: MainTab) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Pressable style={styles.menuRow} onPress={item.onPress}>
      <View style={[styles.menuIconWrap, item.danger && styles.menuIconDanger]}>
        <Ionicons
          name={item.icon}
          size={18}
          color={item.danger ? '#E85D5D' : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
        {item.hint && <Text style={styles.menuHint}>{item.hint}</Text>}
      </View>
      {!item.danger && (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function MineScreen({ scheduleCount, bottomInset, onTabChange, refreshing = false, onRefresh }: MineScreenProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const joinedAt = formatUserCreatedAt(user?.createdAt);

  const handleLogout = () => {
    Alert.alert('退出登录', '确定退出当前账号？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  if (authMode) {
    return (
      <AuthScreen
        mode={authMode}
        onClose={() => setAuthMode(null)}
        onSwitchMode={setAuthMode}
      />
    );
  }

  if (showAbout) {
    return <AboutScreen onClose={() => setShowAbout(false)} />;
  }

  const menuItems: MenuItem[] = isLoggedIn
    ? [
        { icon: 'information-circle-outline', label: '关于日程君', hint: 'v1.0.0', onPress: () => setShowAbout(true) },
        { icon: 'log-out-outline', label: '退出登录', danger: true, onPress: handleLogout },
      ]
    : [
        { icon: 'information-circle-outline', label: '关于日程君', hint: 'v1.0.0', onPress: () => setShowAbout(true) },
      ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + spacing.md }]}
      >
        <Text style={styles.pageTitle}>我的</Text>

        <View style={styles.profileCard}>
          <DefaultAvatar
            nickname={isLoggedIn ? user?.username : undefined}
            size={64}
            guest={!isLoggedIn}
          />
          <View style={styles.profileInfo}>
            {isLoggedIn && user ? (
              <>
                <Text style={styles.displayName}>{user.username}</Text>
                <Text style={styles.username}>@{user.username}</Text>
                {(user.timezone || joinedAt) && (
                  <Text style={styles.profileMeta}>
                    {[user.timezone, joinedAt ? `注册于 ${joinedAt}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.displayName}>未登录</Text>
                <Text style={styles.username}>登录后同步日程与偏好设置</Text>
              </>
            )}
          </View>
        </View>

        {!isLoggedIn && (
          <View style={styles.authActions}>
            <Pressable style={styles.loginButton} onPress={() => setAuthMode('login')}>
              <Text style={styles.loginButtonText}>登录</Text>
            </Pressable>
            <Pressable style={styles.registerButton} onPress={() => setAuthMode('register')}>
              <Text style={styles.registerButtonText}>注册</Text>
            </Pressable>
          </View>
        )}

        {isLoggedIn && (
          <View style={styles.statsRow}>
            <Pressable style={styles.statCard} onPress={() => onTabChange?.('schedules')}>
              <Text style={styles.statValue}>{scheduleCount}</Text>
              <Text style={styles.statLabel}>全部日程</Text>
            </Pressable>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>君听</Text>
              <Text style={styles.statLabel}>语音助手</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>本地</Text>
              <Text style={styles.statLabel}>数据模式</Text>
            </View>
          </View>
        )}

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.label}>
              {index > 0 && <View style={styles.menuDivider} />}
              <MenuRow item={item} />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Schedjun · 日程君</Text>
          <Text style={styles.footerSubText}>让安排更简单</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  username: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  profileMeta: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  authActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loginButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  registerButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.primary,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  menuCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#FEECEC',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  menuLabelDanger: {
    color: '#E85D5D',
  },
  menuHint: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 32 + spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerSubText: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
