import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type {
  ReaderPreferences,
  ReaderTheme,
  ReadingMode,
} from '../../services/readerPreferences';
import { useTheme } from '../../theme';

const FONT_OPTIONS: Array<{
  id: ReaderPreferences['fontFamily'];
  label: string;
}> = [
  { id: 'serif', label: 'Serif' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'monospace', label: 'Mono' },
  { id: 'OpenDyslexic', label: 'OpenDyslexic' },
];

const THEME_OPTIONS: Array<{ id: ReaderTheme; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'dark', label: 'Dark' },
];

const READING_MODE_OPTIONS: Array<{
  id: ReadingMode;
  label: string;
  description: string;
}> = [
  {
    id: 'paginated',
    label: 'Pages',
    description: 'Swipe or tap the sides to move one screen at a time.',
  },
  {
    id: 'scroll',
    label: 'Scroll',
    description: 'Vertical scrolling — no page breaks.',
  },
  {
    id: 'two-page',
    label: 'Two-page',
    description: 'Two columns at once (works best in landscape).',
  },
];

const TEXT_ALIGN_OPTIONS: Array<{
  id: NonNullable<ReaderPreferences['textAlign']>;
  label: string;
}> = [
  { id: 'justify', label: 'Justify' },
  { id: 'start', label: 'Left' },
  { id: 'center', label: 'Center' },
];

const SPREAD_OPTIONS: Array<{
  id: ReaderPreferences['spread'];
  label: string;
}> = [
  { id: 'auto', label: 'Auto' },
  { id: 'never', label: 'Single' },
  { id: 'always', label: 'Spread' },
];

const IMAGE_FILTER_OPTIONS: Array<{
  id: ReaderPreferences['imageFilter'];
  label: string;
}> = [
  { id: 'none', label: 'Original' },
  { id: 'darken', label: 'Darken' },
  { id: 'invert', label: 'Invert' },
];

type ReaderPreferencesEditorProps = {
  preferences: ReaderPreferences;
  onChange: (prefs: ReaderPreferences) => void;
};

export function ReaderPreferencesEditor({
  preferences,
  onChange,
}: ReaderPreferencesEditorProps) {
  const { colors, typography } = useTheme();

  const update = (patch: Partial<ReaderPreferences>) => {
    onChange({ ...preferences, ...patch });
  };

  return (
    <View style={styles.root}>
      <Section title="Reading mode">
        <ChipRow>
          {READING_MODE_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              selected={preferences.readingMode === option.id}
              onPress={() => update({ readingMode: option.id })}
            />
          ))}
        </ChipRow>
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          {
            READING_MODE_OPTIONS.find(option => option.id === preferences.readingMode)
              ?.description
          }
        </Text>
      </Section>

      <Section title="Theme">
        <ChipRow>
          {THEME_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              selected={preferences.theme === option.id}
              onPress={() => update({ theme: option.id })}
            />
          ))}
        </ChipRow>
      </Section>

      <Section title="Font">
        <ChipRow>
          {FONT_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              selected={preferences.fontFamily === option.id}
              onPress={() => update({ fontFamily: option.id })}
            />
          ))}
        </ChipRow>
      </Section>

      <Section title="Text alignment">
        <ChipRow>
          {TEXT_ALIGN_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              selected={preferences.textAlign === option.id}
              onPress={() => update({ textAlign: option.id })}
            />
          ))}
        </ChipRow>
      </Section>

      <Section title="Layout">
        <Stepper
          label="Font size"
          value={preferences.fontSize}
          min={0.9}
          max={2.2}
          step={0.1}
          format={value => `${Math.round(value * 100)}%`}
          onChange={fontSize => update({ fontSize })}
        />
        <Stepper
          label="Line spacing"
          value={preferences.lineHeight}
          min={1.2}
          max={2.2}
          step={0.1}
          format={value => value.toFixed(1)}
          onChange={lineHeight => update({ lineHeight })}
        />
        <Stepper
          label="Margins"
          value={preferences.pageMargins}
          min={0.5}
          max={3}
          step={0.25}
          format={value => value.toFixed(2)}
          onChange={pageMargins => update({ pageMargins })}
        />
        <Stepper
          label="Letter spacing"
          value={preferences.letterSpacing}
          min={0}
          max={0.2}
          step={0.02}
          format={value => value.toFixed(2)}
          onChange={letterSpacing => update({ letterSpacing })}
        />
      </Section>

      {preferences.readingMode === 'two-page' ? (
        <Section title="Two-page spread">
          <ChipRow>
            {SPREAD_OPTIONS.map(option => (
              <Chip
                key={option.id}
                label={option.label}
                selected={preferences.spread === option.id}
                onPress={() => update({ spread: option.id })}
              />
            ))}
          </ChipRow>
        </Section>
      ) : null}

      {preferences.theme === 'dark' ? (
        <Section title="Images in dark mode">
          <ChipRow>
            {IMAGE_FILTER_OPTIONS.map(option => (
              <Chip
                key={option.id}
                label={option.label}
                selected={preferences.imageFilter === option.id}
                onPress={() => update({ imageFilter: option.id })}
              />
            ))}
          </ChipRow>
        </Section>
      ) : null}

      <Section title="Publisher">
        <ToggleRow
          label="Use publisher styles"
          description="Keep the book's original fonts and layout when available."
          value={preferences.publisherStyles}
          onValueChange={publisherStyles => update({ publisherStyles })}
        />
        <ToggleRow
          label="Hyphenation"
          description="Break words across lines when supported."
          value={preferences.hyphens}
          onValueChange={hyphens => update({ hyphens })}
        />
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.caption, styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceContainerLow,
          borderColor: selected ? colors.primary : colors.outlineVariant,
        },
      ]}>
      <Text
        style={[
          typography.caption,
          { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Stepper({
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
  const decrease = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const increase = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <View style={styles.stepper}>
      <Text style={[typography.body, { color: colors.onSurface, flex: 1 }]}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={decrease} style={styles.stepperButton}>
        <Text style={[typography.headline, { color: colors.primary }]}>−</Text>
      </Pressable>
      <Text style={[typography.body, styles.stepperValue, { color: colors.onSurface }]}>
        {format(value)}
      </Text>
      <Pressable accessibilityRole="button" onPress={increase} style={styles.stepperButton}>
        <Text style={[typography.headline, { color: colors.primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.toggleBlock}>
      <View style={styles.toggleRow}>
        <Text style={[typography.body, { color: colors.onSurface, flex: 1 }]}>{label}</Text>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
      {description ? (
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperValue: {
    minWidth: 56,
    textAlign: 'center',
  },
  toggleBlock: {
    gap: 6,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});
