import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

type SettingsProgressCardProps = {
  onBackup: () => void;
  onRestore: () => void;
};

export function SettingsProgressCard({
  onBackup,
  onRestore,
}: SettingsProgressCardProps) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onBackup}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: pressed ? colors.primary : colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Icon name="backup" size={20} color={colors.onPrimary} />
        <Text style={[typography.button, { color: colors.onPrimary }]}>
          Back up progress on device
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onRestore}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: pressed
              ? colors.surfaceContainerHigh
              : colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Icon name="restore" size={20} color={colors.onSurfaceVariant} />
        <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>
          Restore last backup
        </Text>
      </Pressable>

      <Text style={[styles.footnote, { color: colors.onSurfaceVariant }]}>
        Saves bookmarks, position, favorites, and finished status locally.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    elevation: 2,
    gap: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: '#4352a5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footnote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
});
