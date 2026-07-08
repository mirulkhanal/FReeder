import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCoverEnrichmentProgress } from '../../hooks/useCoverEnrichmentProgress';
import { useTheme } from '../../theme';
import { ReadingProgressBar } from '../ReadingProgressBar';

const TAB_BAR_HEIGHT = 56;

export function CoverEnrichmentBar() {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const { active, total, completed, currentTitle } =
    useCoverEnrichmentProgress();

  if (!active || total === 0) {
    return null;
  }

  const fraction = total > 0 ? completed / total : 0;
  const percent = Math.round(fraction * 100);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerHigh,
          borderColor: colors.outlineVariant,
          bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.row}>
        <ActivityIndicator color={colors.primary} size="small" />
        <View style={styles.copy}>
          <Text
            numberOfLines={1}
            style={[
              typography.titleMd,
              { color: colors.onSurface, fontSize: 15 },
            ]}
          >
            Extracting covers
          </Text>
          <Text
            numberOfLines={1}
            style={[typography.caption, { color: colors.onSurfaceVariant }]}
          >
            {completed} of {total} books
            {currentTitle ? ` · ${currentTitle}` : ''}
          </Text>
        </View>
        <Text
          style={[
            typography.caption,
            { color: colors.primary, fontWeight: '700' },
          ]}
        >
          {percent}%
        </Text>
      </View>
      <ReadingProgressBar
        progress={fraction}
        variant="compact"
        showLabel={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    left: 16,
    padding: 12,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
