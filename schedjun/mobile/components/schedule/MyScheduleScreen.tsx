import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_SCHEDULES } from '../../constants/mockSchedules';
import { ScheduleItem } from '../../constants/scheduleTypes';
import { fonts } from '../../constants/fonts';
import { colors, radius, spacing } from '../../constants/theme';
import {
  ScheduleDayGroup,
  filterSchedules,
  formatScheduleTime,
  groupSchedulesByMonth,
} from '../../utils/scheduleUtils';

interface MyScheduleScreenProps {
  onBack: () => void;
}

function SelectionCheckbox({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
    </View>
  );
}

interface DayCardProps {
  group: ScheduleDayGroup;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onLongPressItem: (id: string) => void;
  onPressItem: (id: string) => void;
}

function DayCard({
  group,
  selectionMode,
  selectedIds,
  onLongPressItem,
  onPressItem,
}: DayCardProps) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dateColumn}>
        <Text style={styles.dayNumber}>{group.day}</Text>
        <Text style={styles.weekday}>{group.weekday}</Text>
      </View>

      <View style={styles.eventsColumn}>
        {group.items.map((item, index) => {
          const selected = selectedIds.has(item.id);
          const isLast = index === group.items.length - 1;

          return (
            <Pressable
              key={item.id}
              style={[styles.eventRow, !isLast && styles.eventRowBorder]}
              onPress={() => onPressItem(item.id)}
              onLongPress={() => onLongPressItem(item.id)}
              delayLongPress={300}
            >
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.eventTime}>
                  {formatScheduleTime(item.startTime, item.endTime)}
                </Text>
              </View>

              {selectionMode && <SelectionCheckbox selected={selected} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MyScheduleScreen({ onBack }: MyScheduleScreenProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(MOCK_SCHEDULES);
  const [searchText, setSearchText] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredSchedules = useMemo(
    () => filterSchedules(schedules, searchText),
    [schedules, searchText],
  );

  const sections = useMemo(
    () => groupSchedulesByMonth(filteredSchedules),
    [filteredSchedules],
  );

  const selectedCount = selectedIds.size;
  const allVisibleIds = useMemo(
    () => filteredSchedules.map((item) => item.id),
    [filteredSchedules],
  );
  const allSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const enterSelectionWith = (id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemPress = (id: string) => {
    if (selectionMode) {
      toggleSelection(id);
      return;
    }
  };

  const handleItemLongPress = (id: string) => {
    if (!selectionMode) {
      enterSelectionWith(id);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(allVisibleIds));
  };

  const handleDelete = () => {
    if (selectedCount === 0) {
      return;
    }

    Alert.alert('删除日程', `确定删除已选的 ${selectedCount} 项日程？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          setSchedules((prev) => prev.filter((item) => !selectedIds.has(item.id)));
          exitSelectionMode();
        },
      },
    ]);
  };

  const handleBack = () => {
    if (selectionMode) {
      exitSelectionMode();
      return;
    }
    onBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerBar}>
          <Pressable style={styles.headerButton} onPress={handleBack} hitSlop={8}>
            <Ionicons
              name={selectionMode ? 'close' : 'chevron-back'}
              size={selectionMode ? 24 : 24}
              color={colors.text}
            />
          </Pressable>

          {selectionMode && (
            <Pressable style={styles.headerButton} onPress={handleSelectAll} hitSlop={8}>
              <Ionicons
                name={allSelected ? 'checkbox' : 'checkbox-outline'}
                size={22}
                color={colors.text}
              />
            </Pressable>
          )}
        </View>

        <Text style={styles.pageTitle}>
          {selectionMode ? `已选择${selectedCount}项` : '搜索日程'}
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索日程"
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          selectionMode && selectedCount > 0 && styles.listContentWithFooter,
        ]}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <DayCard
            group={item}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onLongPressItem={handleItemLongPress}
            onPressItem={handleItemPress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>暂无日程</Text>
            <Text style={styles.emptyHint}>
              {searchText.trim() ? '没有匹配的日程' : '创建日程后将显示在这里'}
            </Text>
          </View>
        }
      />

      {selectionMode && selectedCount > 0 && (
        <View style={styles.deleteBar}>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.deleteText}>删除</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundWarm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
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
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listContentWithFooter: {
    paddingBottom: 96,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateColumn: {
    width: 44,
    alignItems: 'center',
    paddingTop: 2,
  },
  dayNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.text,
    lineHeight: 28,
  },
  weekday: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventsColumn: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eventContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  eventTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  eventTime: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  emptyHint: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  deleteBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.backgroundWarm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  deleteText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
