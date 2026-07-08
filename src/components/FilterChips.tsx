import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme';

export type LibraryFilter =
  | 'all'
  | 'reading'
  | 'favorites'
  | 'finished'
  | 'unread'
  | 'series';

const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'finished', label: 'Finished' },
  { id: 'unread', label: 'Unread' },
  { id: 'series', label: 'Series' },
];

type FilterChipsProps = {
  active: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
};

export function FilterChips({ active, onChange }: FilterChipsProps) {
  const { colors, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map(filter => {
        const isActive = filter.id === active;
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(filter.id)}
            style={({ pressed }) => [
              styles.chip,
              isActive
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.outlineVariant,
                    borderWidth: 1,
                  },
              pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text
              style={[
                typography.button,
                {
                  color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingVertical: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});
