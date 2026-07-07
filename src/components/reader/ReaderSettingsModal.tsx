import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { ReaderChromePrefs } from '../../services/readerChromePrefs';
import type { ReaderPreferences } from '../../services/readerPreferences';
import { ReaderChromePrefsEditor } from './ReaderChromePrefsEditor';
import { ReaderPreferencesEditor } from './ReaderPreferencesEditor';
import { useTheme } from '../../theme';

type ReaderSettingsModalProps = {
  visible: boolean;
  preferences: ReaderPreferences;
  chromePrefs: ReaderChromePrefs;
  bookOverrideEnabled: boolean;
  onChange: (prefs: ReaderPreferences) => void;
  onChromePrefsChange: (prefs: ReaderChromePrefs) => void;
  onBookOverrideChange: (enabled: boolean) => void;
  onClose: () => void;
};

export function ReaderSettingsModal({
  visible,
  preferences,
  chromePrefs,
  bookOverrideEnabled,
  onChange,
  onChromePrefsChange,
  onBookOverrideChange,
  onClose,
}: ReaderSettingsModalProps) {
  const { colors, typography } = useTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.header}>
            <Text style={[typography.headline, { color: colors.onSurface }]}>
              Reading settings
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={[typography.button, { color: colors.primary }]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.overrideBlock}>
              <View style={styles.overrideRow}>
                <Text style={[typography.body, { color: colors.onSurface, flex: 1 }]}>
                  Custom settings for this book
                </Text>
                <Switch value={bookOverrideEnabled} onValueChange={onBookOverrideChange} />
              </View>
              <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                {bookOverrideEnabled
                  ? 'Changes apply only to this book.'
                  : 'Using your global reading preferences.'}
              </Text>
            </View>

            <ReaderPreferencesEditor preferences={preferences} onChange={onChange} />
            <View style={styles.divider} />
            <ReaderChromePrefsEditor chromePrefs={chromePrefs} onChange={onChromePrefsChange} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  content: {
    gap: 20,
    paddingBottom: 16,
  },
  overrideBlock: {
    gap: 6,
  },
  overrideRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  divider: {
    height: 1,
  },
});
