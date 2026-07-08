import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme';

export type LibrarySort = 'title' | 'author' | 'recent' | 'added';

const SORTS: { id: LibrarySort; label: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
  { id: 'recent', label: 'Recent' },
  { id: 'added', label: 'Added' },
];

type SortChipsProps = {
  active: LibrarySort;
  onChange: (sort: LibrarySort) => void;
};

export function SortChips({ active, onChange }: SortChipsProps) {
  const { colors, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Text
        style={[
          typography.caption,
          styles.label,
          { color: colors.onSurfaceVariant },
        ]}
      >
        Sort
      </Text>
      {SORTS.map(sort => {
        const isActive = sort.id === active;
        return (
          <Pressable
            key={sort.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(sort.id)}
            style={({ pressed }) => [
              styles.chip,
              isActive
                ? {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderColor: colors.primary,
                    borderWidth: 1,
                  }
                : {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.outlineVariant,
                    borderWidth: 1,
                  },
              pressed && { opacity: 0.92 },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: isActive ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {sort.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  label: {
    marginRight: 4,
    textTransform: 'uppercase',
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
