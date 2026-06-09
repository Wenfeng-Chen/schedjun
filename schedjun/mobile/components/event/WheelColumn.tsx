import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fonts } from '../../constants/fonts';
import { colors, radius } from '../../constants/theme';

export const WHEEL_ITEM_HEIGHT = 44;
export const WHEEL_VISIBLE_COUNT = 5;

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  activeSuffix?: string;
  width?: number | `${number}%`;
}

function indexFromOffset(offsetY: number, maxIndex: number): number {
  return Math.max(0, Math.min(maxIndex, Math.round(offsetY / WHEEL_ITEM_HEIGHT)));
}

export default function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  activeSuffix,
  width = '33.33%',
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const paddingVertical = WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_COUNT / 2);
  const maxIndex = items.length - 1;

  const indexRef = useRef(selectedIndex);
  const isDraggingRef = useRef(false);
  const skipSyncRef = useRef(false);
  const pendingMomentumRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [highlightIndex, setHighlightIndex] = useState(selectedIndex);

  const clearSettleTimer = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    scrollRef.current?.scrollTo({
      y: index * WHEEL_ITEM_HEIGHT,
      animated,
    });
  }, []);

  useEffect(() => {
    indexRef.current = selectedIndex;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (isDraggingRef.current || pendingMomentumRef.current) {
      return;
    }
    setHighlightIndex(selectedIndex);
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  const commitIndex = useCallback(
    (index: number) => {
      indexRef.current = index;
      setHighlightIndex(index);
      if (index !== selectedIndex) {
        skipSyncRef.current = true;
        onSelect(index);
      }
    },
    [onSelect, selectedIndex],
  );

  const settleAtOffset = useCallback(
    (offsetY: number, animated: boolean) => {
      clearSettleTimer();

      const index = indexFromOffset(offsetY, maxIndex);
      const targetY = index * WHEEL_ITEM_HEIGHT;

      commitIndex(index);

      if (Math.abs(offsetY - targetY) < 0.5) {
        return;
      }

      scrollToIndex(index, animated);
    },
    [clearSettleTimer, commitIndex, maxIndex, scrollToIndex],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isDraggingRef.current && !pendingMomentumRef.current) {
      return;
    }
    const index = indexFromOffset(event.nativeEvent.contentOffset.y, maxIndex);
    if (index !== highlightIndex) {
      setHighlightIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    clearSettleTimer();
    pendingMomentumRef.current = false;
    isDraggingRef.current = true;
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    const velocityY = event.nativeEvent.velocity?.y ?? 0;

    // 有明显惯性时交给 onMomentumScrollEnd，避免连续两次 scrollTo 打架
    if (Math.abs(velocityY) > 0.15) {
      pendingMomentumRef.current = true;
      return;
    }

    pendingMomentumRef.current = false;
    settleAtOffset(event.nativeEvent.contentOffset.y, false);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    pendingMomentumRef.current = false;
    settleAtOffset(event.nativeEvent.contentOffset.y, false);
  };

  const handleItemPress = (index: number) => {
    clearSettleTimer();
    pendingMomentumRef.current = false;
    isDraggingRef.current = false;
    commitIndex(index);
    scrollToIndex(index, true);
  };

  useEffect(() => clearSettleTimer, [clearSettleTimer]);

  return (
    <View style={[styles.column, { width }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical }}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {items.map((label, index) => {
          const isSelected = index === highlightIndex;
          return (
            <Pressable
              key={`${label}-${index}`}
              style={styles.item}
              onPress={() => handleItemPress(index)}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {label}
                {isSelected && activeSuffix ? activeSuffix : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT,
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  itemText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
  },
  itemTextSelected: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: colors.primary,
  },
});

export const wheelStyles = StyleSheet.create({
  frame: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_COUNT / 2),
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    pointerEvents: 'none',
  },
});
