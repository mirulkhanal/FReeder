import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type {
  ReaderChromePrefs,
  TapZoneAction,
  TapZones,
} from '../../services/readerChromePrefs';
import { useTheme } from '../../theme';

const TAP_ZONE_LABELS: Record<keyof TapZones, string> = {
  left: 'Left edge',
  center: 'Center',
  right: 'Right edge',
};

const TAP_ZONE_ACTIONS: Array<{ id: TapZoneAction; label: string }> = [
  { id: 'prev', label: 'Previous' },
  { id: 'next', label: 'Next' },
  { id: 'menu', label: 'Menu' },
  { id: 'none', label: 'None' },
];

type ReaderChromePrefsEditorProps = {
  chromePrefs: ReaderChromePrefs;
  onChange: (prefs: ReaderChromePrefs) => void;
};

export function ReaderChromePrefsEditor({
  chromePrefs,
  onChange,
}: ReaderChromePrefsEditorProps) {
  const { colors, typography } = useTheme();

  const update = (patch: Partial<ReaderChromePrefs>) => {
    onChange({ ...chromePrefs, ...patch });
  };

  const updateTapZone = (zone: keyof TapZones, action: TapZoneAction) => {
    onChange({
      ...chromePrefs,
      tapZones: { ...chromePrefs.tapZones, [zone]: action },
    });
  };

  return (
    <View style={styles.root}>
      <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginBottom: 4 }]}>
        Tap zones, brightness, blue-light filter, and auto-scroll.
      </Text>
      <Section title="Tap zones">
        {(Object.keys(TAP_ZONE_LABELS) as Array<keyof TapZones>).map(zone => (
          <View key={zone} style={styles.zoneBlock}>
            <Text style={[typography.body, { color: colors.onSurface }]}>
              {TAP_ZONE_LABELS[zone]}
            </Text>
            <View style={styles.chipRow}>
              {TAP_ZONE_ACTIONS.map(action => (
                <Chip
                  key={action.id}
                  label={action.label}
                  selected={chromePrefs.tapZones[zone] === action.id}
                  onPress={() => updateTapZone(zone, action.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title="Comfort">
        <Stepper
          label="Brightness overlay"
          value={chromePrefs.brightnessOverlay}
          min={0}
          max={0.6}
          step={0.05}
          format={value => `${Math.round(value * 100)}%`}
          onChange={brightnessOverlay => update({ brightnessOverlay })}
        />
        <ToggleRow
          label="Blue light filter"
          description="Warm tint to reduce eye strain in low light."
          value={chromePrefs.blueLightFilter}
          onValueChange={blueLightFilter => update({ blueLightFilter })}
        />
      </Section>

      <Section title="Auto-scroll">
        <Stepper
          label="Scroll speed"
          value={chromePrefs.autoScrollWpm}
          min={0}
          max={400}
          step={25}
          format={value => (value === 0 ? 'Off' : `${value} WPM`)}
          onChange={autoScrollWpm => update({ autoScrollWpm })}
        />
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          Applies in scroll reading mode only. Set to 0 to disable.
        </Text>
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
  zoneBlock: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
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
    minWidth: 72,
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
