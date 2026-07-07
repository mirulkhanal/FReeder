import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

type SettingsLibraryCardProps = {
  hasLibraryFolder: boolean;
  onRefreshLibrary: () => void;
  onReextractCovers: () => void;
  onFindDuplicates: () => void;
  onClearLibrary: () => void;
};

const ERROR_CONTAINER = '#ffdad6';
const ON_ERROR_CONTAINER = '#93000a';

export function SettingsLibraryCard({
  hasLibraryFolder,
  onRefreshLibrary,
  onReextractCovers,
  onFindDuplicates,
  onClearLibrary,
}: SettingsLibraryCardProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        disabled={!hasLibraryFolder}
        onPress={onRefreshLibrary}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: colors.primary,
            opacity: !hasLibraryFolder ? 0.5 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <Icon name="refresh" size={20} color={colors.onPrimary} />
        <Text style={[typography.button, { color: colors.onPrimary }]}>
          Refresh library folder
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onReextractCovers}
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
        <Icon name="image" size={20} color={colors.onSurfaceVariant} />
        <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>
          Re-extract covers
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onFindDuplicates}
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
        <Icon name="content-copy" size={20} color={colors.onSurfaceVariant} />
        <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>
          Find duplicate books
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onClearLibrary}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? '#f5c4be' : ERROR_CONTAINER,
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <Icon name="delete-forever" size={20} color={ON_ERROR_CONTAINER} />
        <Text style={[typography.button, styles.buttonText]}>
          Clear library
        </Text>
      </Pressable>

      <Text style={[styles.footnote, { color: ON_ERROR_CONTAINER }]}>
        This will remove every book from FReeder and reset progress.{' '}
        <Text style={styles.footnoteBold}>
          Your physical EPUB files will not be touched.
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 218, 214, 0.1)',
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    padding: 24,
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
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: ON_ERROR_CONTAINER,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.85,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  footnoteBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
