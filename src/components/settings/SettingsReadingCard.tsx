import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../theme';

import type {
  ReaderPreferences,
  ReaderTheme,
  ReadingMode,
  SpreadMode,
  ImageFilterMode,
} from '../../services/readerPreferences';

const READING_MODES: Array<{ id: ReadingMode; label: string }> = [
  { id: 'paginated', label: 'Pages' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'two-page', label: 'Two-page' },
];

const THEMES: Array<{
  id: ReaderTheme;
  label: string;
  swatch: string;
  cardBg: string;
}> = [
  { id: 'light', label: 'Light', swatch: '#ffffff', cardBg: '#ffffff' },
  { id: 'sepia', label: 'Sepia', swatch: '#f4ecd8', cardBg: '#f4ecd8' },
  { id: 'dark', label: 'Dark', swatch: '#1a1c1d', cardBg: '#1a1c1d' },
];

const FONTS: Array<{
  id: ReaderPreferences['fontFamily'];
  label: string;
  style: 'serif' | 'sans' | 'mono' | 'dyslexic';
}> = [
  { id: 'serif', label: 'Serif', style: 'serif' },
  { id: 'sans-serif', label: 'Sans', style: 'sans' },
  { id: 'monospace', label: 'Mono', style: 'mono' },
  { id: 'OpenDyslexic', label: 'OpenDyslexic', style: 'dyslexic' },
];

const TEXT_ALIGNS: Array<{
  id: ReaderPreferences['textAlign'];
  label: string;
}> = [
  { id: 'justify', label: 'Justify' },
  { id: 'start', label: 'Left' },
  { id: 'center', label: 'Center' },
];

const SPREAD_OPTIONS: Array<{ id: SpreadMode; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'never', label: 'Single' },
  { id: 'always', label: 'Spread' },
];

const IMAGE_FILTER_OPTIONS: Array<{ id: ImageFilterMode; label: string }> = [
  { id: 'none', label: 'Original' },
  { id: 'darken', label: 'Darken' },
  { id: 'invert', label: 'Invert' },
];

type SettingsReadingCardProps = {
  preferences: ReaderPreferences;
  onChange: (prefs: ReaderPreferences) => void;
  onReset: () => void;
};

export function SettingsReadingCard({
  preferences,
  onChange,
  onReset,
}: SettingsReadingCardProps) {
  const { colors, typography } = useTheme();

  const patch = (partial: Partial<ReaderPreferences>) => {
    onChange({ ...preferences, ...partial });
  };

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}
    >
      <FieldLabel text="Reading Mode" />
      <View style={styles.pillRow}>
        {READING_MODES.map(mode => {
          const selected = preferences.readingMode === mode.id;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => patch({ readingMode: mode.id })}
              style={[
                styles.pill,
                selected
                  ? [
                      styles.pillActive,
                      { backgroundColor: colors.primaryContainer },
                    ]
                  : { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Text
                style={[
                  typography.button,
                  {
                    color: selected
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FieldLabel text="Theme" />
      <View style={styles.themeRow}>
        {THEMES.map(theme => {
          const selected = preferences.theme === theme.id;
          const labelColor =
            theme.id === 'dark' && !selected
              ? colors.onSurfaceVariant
              : selected
              ? colors.primary
              : colors.onSurfaceVariant;
          return (
            <Pressable
              key={theme.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => patch({ theme: theme.id })}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: selected
                    ? colors.primaryContainer
                    : colors.surfaceContainer,
                  borderWidth: selected ? 2 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: theme.swatch,
                    borderColor:
                      theme.id === 'light'
                        ? colors.outlineVariant
                        : 'rgba(0,0,0,0.08)',
                  },
                ]}
              />
              <Text style={[typography.caption, { color: labelColor }]}>
                {theme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FieldLabel text="Font" />
      <View style={styles.fontRow}>
        {FONTS.map(font => {
          const selected = preferences.fontFamily === font.id;
          return (
            <Pressable
              key={font.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => patch({ fontFamily: font.id })}
              style={[
                styles.fontChip,
                selected
                  ? [
                      styles.fontChipActive,
                      { backgroundColor: colors.primaryContainer },
                    ]
                  : { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Text
                style={[
                  typography.button,
                  fontTextStyle(font.style),
                  {
                    color: selected
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {font.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FieldLabel text="Text Alignment" />
      <View style={styles.pillRow}>
        {TEXT_ALIGNS.map(align => {
          const selected = preferences.textAlign === align.id;
          return (
            <Pressable
              key={align.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => patch({ textAlign: align.id })}
              style={[
                styles.pill,
                selected
                  ? [
                      styles.pillActive,
                      { backgroundColor: colors.primaryContainer },
                    ]
                  : { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Text
                style={[
                  typography.button,
                  {
                    color: selected
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {align.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PreferenceSlider
        label="Font Size"
        value={preferences.fontSize}
        min={0.9}
        max={2.2}
        step={0.1}
        format={v => `${Math.round(v * 100)}%`}
        onChange={fontSize => patch({ fontSize })}
      />
      <PreferenceSlider
        label="Line Spacing"
        value={preferences.lineHeight}
        min={1.2}
        max={2.2}
        step={0.1}
        format={v => v.toFixed(1)}
        onChange={lineHeight => patch({ lineHeight })}
      />
      <PreferenceSlider
        label="Margins"
        value={preferences.pageMargins}
        min={0.5}
        max={3}
        step={0.25}
        format={v => v.toFixed(2)}
        onChange={pageMargins => patch({ pageMargins })}
      />
      <PreferenceSlider
        label="Letter Spacing"
        value={preferences.letterSpacing}
        min={0}
        max={0.2}
        step={0.02}
        format={v => v.toFixed(2)}
        onChange={letterSpacing => patch({ letterSpacing })}
      />

      {preferences.readingMode === 'two-page' ? (
        <>
          <FieldLabel text="Two-page Spread" />
          <View style={styles.pillRow}>
            {SPREAD_OPTIONS.map(option => {
              const selected = preferences.spread === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch({ spread: option.id })}
                  style={[
                    styles.pill,
                    selected
                      ? [
                          styles.pillActive,
                          { backgroundColor: colors.primaryContainer },
                        ]
                      : { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <Text
                    style={[
                      typography.button,
                      {
                        color: selected
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {preferences.theme === 'dark' ? (
        <>
          <FieldLabel text="Images in Dark Mode" />
          <View style={styles.pillRow}>
            {IMAGE_FILTER_OPTIONS.map(option => {
              const selected = preferences.imageFilter === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch({ imageFilter: option.id })}
                  style={[
                    styles.pill,
                    selected
                      ? [
                          styles.pillActive,
                          { backgroundColor: colors.primaryContainer },
                        ]
                      : { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <Text
                    style={[
                      typography.button,
                      {
                        color: selected
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text
            style={[
              typography.body,
              styles.toggleTitle,
              { color: colors.onSurface },
            ]}
          >
            Use publisher styles
          </Text>
          <Text style={[styles.toggleHint, { color: colors.outline }]}>
            Maintain original book fonts and layout
          </Text>
        </View>
        <Switch
          value={preferences.publisherStyles}
          onValueChange={publisherStyles => patch({ publisherStyles })}
          trackColor={{
            false: colors.surfaceContainerHighest,
            true: colors.primaryContainer,
          }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text
            style={[
              typography.body,
              styles.toggleTitle,
              { color: colors.onSurface },
            ]}
          >
            Hyphenation
          </Text>
          <Text style={[styles.toggleHint, { color: colors.outline }]}>
            Break words across lines when supported
          </Text>
        </View>
        <Switch
          value={preferences.hyphens}
          onValueChange={hyphens => patch({ hyphens })}
          trackColor={{
            false: colors.surfaceContainerHighest,
            true: colors.primaryContainer,
          }}
          thumbColor="#ffffff"
        />
      </View>

      <View
        style={[
          styles.resetDivider,
          { borderTopColor: colors.surfaceContainerLow },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onReset}
        style={({ pressed }) => [
          styles.resetButton,
          {
            borderColor: colors.outlineVariant,
            backgroundColor: pressed
              ? colors.surfaceContainerLow
              : 'transparent',
          },
        ]}
      >
        <Text style={[typography.button, { color: colors.onSurfaceVariant }]}>
          Reset reading settings to default
        </Text>
      </Pressable>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[typography.caption, styles.fieldLabel, { color: colors.outline }]}
    >
      {text.toUpperCase()}
    </Text>
  );
}

function PreferenceSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const { colors, typography } = useTheme();
  const progress = (value - min) / (max - min);
  const decrease = () =>
    onChange(Math.max(min, Number((value - step).toFixed(2))));
  const increase = () =>
    onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHeader}>
        <Text
          style={[
            typography.caption,
            styles.fieldLabel,
            { color: colors.outline },
          ]}
        >
          {label.toUpperCase()}
        </Text>
        <Text style={[typography.titleMd, { color: colors.primary }]}>
          {format(value)}
        </Text>
      </View>
      <View style={styles.sliderRow}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={decrease}>
          <Icon name="remove-circle-outline" size={24} color={colors.primary} />
        </Pressable>
        <View
          style={[
            styles.track,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <View
            style={[
              styles.trackFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={increase}>
          <Icon name="add-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function fontTextStyle(style: 'serif' | 'sans' | 'mono' | 'dyslexic') {
  switch (style) {
    case 'serif':
      return { fontFamily: 'serif', fontStyle: 'italic' as const };
    case 'mono':
      return { fontFamily: 'monospace', fontSize: 13 };
    case 'dyslexic':
      return { fontSize: 12 };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    elevation: 2,
    gap: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  fieldLabel: {
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  themeCard: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    gap: 8,
    paddingVertical: 16,
  },
  swatch: {
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    width: 32,
  },
  fontRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  fontChip: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fontChipActive: {},
  sliderBlock: {
    gap: 16,
  },
  sliderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  track: {
    borderRadius: 999,
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  trackFill: {
    borderRadius: 999,
    height: '100%',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontWeight: '600',
  },
  toggleHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  resetDivider: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  resetButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
  },
});
