import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatReadingDuration,
  type ReadingStatistics,
} from '../../services/readingStatistics';
import { useTheme } from '../../theme';

type SettingsStatisticsCardProps = {
  stats: ReadingStatistics;
};

type StatItemProps = {
  label: string;
  value: string;
};

function StatItem({ label, value }: StatItemProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.statItem}>
      <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[typography.headline, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

export function SettingsStatisticsCard({ stats }: SettingsStatisticsCardProps) {
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
      <View style={styles.grid}>
        <StatItem
          label="Total reading time"
          value={formatReadingDuration(stats.totalReadingSeconds)}
        />
        <StatItem label="Books finished" value={String(stats.booksFinished)} />
        <StatItem
          label="Current streak"
          value={`${stats.currentStreakDays} day${stats.currentStreakDays === 1 ? '' : 's'}`}
        />
        <StatItem
          label="Longest streak"
          value={`${stats.longestStreakDays} day${stats.longestStreakDays === 1 ? '' : 's'}`}
        />
      </View>
      <Text style={[typography.caption, styles.footnote, { color: colors.onSurfaceVariant }]}>
        Reading time and streaks are tracked locally while you read in FReeder.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  statItem: {
    gap: 4,
    minWidth: '42%',
  },
  footnote: {
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
});
