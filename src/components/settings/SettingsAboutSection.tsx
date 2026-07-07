import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

type SettingsAboutSectionProps = {
  version: string;
};

export function SettingsAboutSection({ version }: SettingsAboutSectionProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surfaceContainerHigh },
        ]}
      >
        <Icon name="info" size={32} color={colors.primary} />
      </View>

      <Text style={[typography.headline, { color: colors.onSurface }]}>
        About FReeder
      </Text>
      <Text
        style={[
          typography.body,
          styles.version,
          { color: colors.onSurfaceVariant },
        ]}
      >
        Version {version}
      </Text>

      <View style={styles.tags}>
        {['EPUB 2', 'EPUB 3', 'DRM-Free'].map(tag => (
          <View
            key={tag}
            style={[
              styles.tag,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.disclaimer, { color: colors.outline }]}>
        PDF, MOBI, and Kindle proprietary formats are currently not supported to
        maintain the high typographic standards of the reading engine.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 16,
    width: 64,
  },
  version: {
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 18,
    textAlign: 'center',
  },
});
