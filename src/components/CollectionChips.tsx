import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme';

import type { BookCollection } from '../services/collectionsStorage';

type CollectionChipsProps = {
  collections: BookCollection[];
  activeCollectionId: string | null;
  onChange: (collectionId: string | null) => void;
  onManagePress?: () => void;
};

export function CollectionChips({
  collections,
  activeCollectionId,
  onChange,
  onManagePress,
}: CollectionChipsProps) {
  const { colors, typography } = useTheme();

  if (collections.length === 0 && !onManagePress) {
    return null;
  }

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
        Collections
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: activeCollectionId === null }}
        onPress={() => onChange(null)}
        style={({ pressed }) => [
          styles.chip,
          activeCollectionId === null
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
              color:
                activeCollectionId === null
                  ? colors.onPrimary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          All
        </Text>
      </Pressable>
      {collections.map(collection => {
        const isActive = collection.id === activeCollectionId;
        return (
          <Pressable
            key={collection.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(collection.id)}
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
              {collection.name}
            </Text>
          </Pressable>
        );
      })}
      {onManagePress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onManagePress}
          style={({ pressed }) => [
            styles.chip,
            styles.manageChip,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
            pressed && { opacity: 0.92 },
          ]}
        >
          <Text style={[typography.button, { color: colors.primary }]}>
            Manage
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  label: {
    alignSelf: 'center',
    marginRight: 4,
    textTransform: 'uppercase',
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  manageChip: {
    borderWidth: 1,
  },
});
