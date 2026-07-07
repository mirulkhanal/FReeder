import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppAppearanceMode } from '../../services/appAppearance';
import { useTheme } from '../../theme';

const APPEARANCE_OPTIONS: Array<{ id: AppAppearanceMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

type SettingsAppearanceCardProps = {
  mode: AppAppearanceMode;
  onChange: (mode: AppAppearanceMode) => void;
};

export function SettingsAppearanceCard({ mode, onChange }: SettingsAppearanceCardProps) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant,
        },
      ]}>
      <Text style={[typography.caption, styles.fieldLabel, { color: colors.outline }]}>
        APP THEME
      </Text>
      <View style={styles.pillRow}>
        {APPEARANCE_OPTIONS.map(option => {
          const selected = mode === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[
                styles.pill,
                selected
                  ? [styles.pillActive, { backgroundColor: colors.primaryContainer }]
                  : { backgroundColor: colors.surfaceContainerLow },
              ]}>
              <Text
                style={[
                  typography.button,
                  { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[typography.caption, styles.hint, { color: colors.onSurfaceVariant }]}>
        Controls the library, settings, and navigation. Reader theme is set separately under
        Reading Defaults.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    elevation: 2,
    gap: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  fieldLabel: {
    letterSpacing: 1.2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pillActive: {
    elevation: 2,
    shadowColor: '#5c6bc0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  hint: {
    lineHeight: 18,
  },
});
