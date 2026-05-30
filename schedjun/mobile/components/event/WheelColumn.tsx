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

  const [highlightIndex, setHighlightIndex] = useState(selectedIndex);

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
    setHighlightIndex(selectedIndex);
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  const settleAtOffset = useCallback(
    (offsetY: number, animated: boolean) => {
      const index = indexFromOffset(offsetY, maxIndex);
      indexRef.current = index;
      setHighlightIndex(index);

      if (index !== selectedIndex) {
        skipSyncRef.current = true;
        onSelect(index);
      }

      scrollToIndex(index, animated);
    },
    [maxIndex, onSelect, scrollToIndex, selectedIndex],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isDraggingRef.current) {
      return;
    }
    const index = indexFromOffset(event.nativeEvent.contentOffset.y, maxIndex);
    setHighlightIndex(index);
  };

  const handleScrollBeginDrag = () => {
    isDraggingRef.current = true;
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    const velocityY = event.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(velocityY) <= 0.05) {
      settleAtOffset(event.nativeEvent.contentOffset.y, true);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    settleAtOffset(event.nativeEvent.contentOffset.y, true);
  };

  const handleItemPress = (index: number) => {
    settleAtOffset(index * WHEEL_ITEM_HEIGHT, true);
  };

  return (
    <View style={[styles.column, { width }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="normal"
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
