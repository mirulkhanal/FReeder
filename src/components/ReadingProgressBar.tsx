import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type ReadingProgressBarProps = {
  progress: number;
  variant?: 'default' | 'compact';
  showLabel?: boolean;
  onDark?: boolean;
};

export function ReadingProgressBar({
  progress,
  variant = 'default',
  showLabel = true,
  onDark = false,
}: ReadingProgressBarProps) {
  const { colors, typography } = useTheme();
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
  const isCompact = variant === 'compact';

  return (
    <View style={isCompact ? styles.compactRoot : styles.defaultRoot}>
      {!isCompact && showLabel ? (
        <View style={styles.progressHeader}>
          <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
            Progress
          </Text>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            {percent}%
          </Text>
        </View>
      ) : null}
      <View
        style={[
          isCompact ? styles.compactTrack : styles.defaultTrack,
          {
            backgroundColor: onDark
              ? 'rgba(255, 255, 255, 0.25)'
              : colors.surfaceContainerHighest,
          },
        ]}>
        <View
          style={[
            isCompact ? styles.compactFill : styles.defaultFill,
            { backgroundColor: colors.primary, width: `${percent}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  defaultRoot: {
    width: '100%',
  },
  compactRoot: {
    width: '100%',
  },
  progressHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  defaultTrack: {
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  defaultFill: {
    borderRadius: 999,
    height: '100%',
  },
  compactTrack: {
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
    width: '100%',
  },
  compactFill: {
    borderRadius: 999,
    height: '100%',
  },
});
