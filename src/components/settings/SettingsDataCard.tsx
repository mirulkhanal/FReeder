import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

type SettingsDataCardProps = {
  onBackupLocal: () => void;
  onRestoreLocal: () => void;
  onExportFile: () => void;
  onImportFile: () => void;
  onExportAnnotations: () => void;
};

export function SettingsDataCard({
  onBackupLocal,
  onRestoreLocal,
  onExportFile,
  onImportFile,
  onExportAnnotations,
}: SettingsDataCardProps) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}
    >
      <Text
        style={[
          typography.body,
          styles.copy,
          { color: colors.onSurfaceVariant },
        ]}
      >
        Back up reading progress, bookmarks, highlights, collections, and
        preferences. Export a JSON file to move data between devices.
      </Text>

      <ActionButton
        colors={colors}
        icon="backup"
        label="Back up on this device"
        onPress={onBackupLocal}
        typography={typography}
      />
      <ActionButton
        colors={colors}
        icon="restore"
        label="Restore last backup"
        onPress={onRestoreLocal}
        typography={typography}
      />
      <ActionButton
        colors={colors}
        icon="upload-file"
        label="Export backup file"
        onPress={onExportFile}
        typography={typography}
      />
      <ActionButton
        colors={colors}
        icon="download"
        label="Import backup file"
        onPress={onImportFile}
        typography={typography}
      />
      <ActionButton
        colors={colors}
        icon="notes"
        label="Export all highlights (library)"
        onPress={onExportAnnotations}
        typography={typography}
      />
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  colors,
  typography,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? colors.surfaceContainerHigh
            : colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={[typography.button, { color: colors.onSurface }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 12,
    padding: 16,
  },
  copy: {
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
