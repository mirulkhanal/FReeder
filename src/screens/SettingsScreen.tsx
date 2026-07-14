import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { FindDuplicatesModal } from '../components/settings/FindDuplicatesModal';
import { SettingsAboutSection } from '../components/settings/SettingsAboutSection';
import { SettingsAppearanceCard } from '../components/settings/SettingsAppearanceCard';
import { SettingsDataCard } from '../components/settings/SettingsDataCard';
import { SettingsLibraryCard } from '../components/settings/SettingsLibraryCard';
import { SettingsReadingCard } from '../components/settings/SettingsReadingCard';
import { SettingsSectionHeader } from '../components/settings/SettingsSectionHeader';
import { SettingsStatisticsCard } from '../components/settings/SettingsStatisticsCard';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { useLibrary } from '../context/LibraryContext';
import { exportFullBackupToShare } from '../services/annotationsExport';
import {
  exportLocalAppBackup,
  exportAppBackupToFile,
  pickAndImportAppBackup,
  restoreLocalAppBackup,
} from '../services/appBackup';
import { loadAllHighlightsMap } from '../services/bookAnnotations';
import {
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
  resetReaderPreferences,
  saveReaderPreferences,
  type ReaderPreferences,
} from '../services/readerPreferences';
import {
  loadReadingStatistics,
  type ReadingStatistics,
} from '../services/readingStatistics';
import { showThemedAlert, showThemedDialog } from '../services/themedDialog';
import { useTheme } from '../theme';

import type { Book } from '../types/book';

const APP_VERSION = '0.0.1';

export function SettingsScreen() {
  const { colors, typography, appearanceMode, setAppearanceMode } = useTheme();
  const {
    books,
    folderUri,
    clearLibrary,
    refreshLibrary,
    reextractCovers,
    removeBook,
  } = useLibrary();
  const [preferences, setPreferences] = useState<ReaderPreferences>(
    DEFAULT_READER_PREFERENCES,
  );
  const [stats, setStats] = useState<ReadingStatistics | null>(null);
  const [duplicatesVisible, setDuplicatesVisible] = useState(false);

  useEffect(() => {
    void loadReaderPreferences().then(setPreferences);
    void loadReadingStatistics().then(setStats);
  }, []);

  const updatePreferences = useCallback((next: ReaderPreferences) => {
    setPreferences(next);
    void saveReaderPreferences(next);
  }, []);

  const handleResetReading = useCallback(() => {
    showThemedDialog({
      title: 'Reset reading settings?',
      message:
        'Restore theme, fonts, layout, and reading mode to FReeder defaults.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void resetReaderPreferences().then(setPreferences);
          },
        },
      ],
    });
  }, []);

  const handleBackupLocal = useCallback(async () => {
    await exportLocalAppBackup();
    showThemedAlert(
      'Backup saved',
      'Progress, bookmarks, highlights, collections, and preferences were saved on this device.',
    );
  }, []);

  const handleRestoreLocal = useCallback(async () => {
    const restored = await restoreLocalAppBackup();
    showThemedAlert(
      restored ? 'Backup restored' : 'No backup found',
      restored
        ? 'Your last on-device backup was restored. Reopen books to refresh.'
        : 'Create a backup first, then restore when needed.',
    );
  }, []);

  const handleExportBackupFile = useCallback(async () => {
    try {
      const json = await exportAppBackupToFile();
      await exportFullBackupToShare(json);
    } catch (error) {
      showThemedAlert(
        'Export failed',
        error instanceof Error ? error.message : 'Could not export backup.',
      );
    }
  }, []);

  const handleImportBackupFile = useCallback(async () => {
    try {
      const imported = await pickAndImportAppBackup();
      showThemedAlert(
        imported ? 'Backup imported' : 'Import cancelled',
        imported ? 'Your library data was restored from the file.' : undefined,
      );
    } catch (error) {
      showThemedAlert(
        'Import failed',
        error instanceof Error ? error.message : 'Could not import backup.',
      );
    }
  }, []);

  const handleExportAllAnnotations = useCallback(async () => {
    const highlights = await loadAllHighlightsMap();
    const lines = ['# FReeder highlights export', ''];
    for (const [bookId, items] of Object.entries(highlights)) {
      if (items.length === 0) {
        continue;
      }
      lines.push(`## ${bookId}`, '');
      for (const item of items) {
        const text = String(item.extras?.selectedText ?? '').trim();
        const note = String(item.extras?.note ?? '').trim();
        if (text) {
          lines.push(`> ${text}`);
        }
        if (note) {
          lines.push(`> _${note}_`);
        }
        lines.push('');
      }
    }
    await Share.share({
      title: 'FReeder highlights',
      message: lines.join('\n'),
    });
  }, []);

  const handleFindDuplicates = useCallback(() => {
    setDuplicatesVisible(true);
  }, []);

  const handleRemoveDuplicate = useCallback(
    (book: Book) => {
      void removeBook(book);
    },
    [removeBook],
  );

  const handleRefreshLibrary = useCallback(() => {
    void (async () => {
      try {
        await refreshLibrary();
        showThemedAlert(
          'Library refreshed',
          'Your library folder was scanned again.',
        );
      } catch (error) {
        showThemedAlert(
          'Refresh failed',
          error instanceof Error
            ? error.message
            : 'Could not refresh the library folder.',
        );
      }
    })();
  }, [refreshLibrary]);

  const handleReextractCovers = useCallback(() => {
    void reextractCovers().then(count => {
      if (count === 0) {
        showThemedAlert(
          'Covers up to date',
          'Every book already has a valid cover on disk.',
        );
        return;
      }
      showThemedAlert(
        'Re-extracting covers',
        `Re-extracting covers for ${count} book${
          count === 1 ? '' : 's'
        } in the background.`,
      );
    });
  }, [reextractCovers]);

  const handleClearLibrary = useCallback(() => {
    if (books.length === 0) {
      showThemedAlert(
        'Library is empty',
        'There are no books to remove from FReeder.',
      );
      return;
    }

    showThemedDialog({
      title: 'Clear library?',
      message: `Remove all ${books.length} book${
        books.length === 1 ? '' : 's'
      } from FReeder? Your EPUB files on this device will not be deleted.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear library',
          style: 'destructive',
          onPress: () => {
            void clearLibrary()
              .then(() => {
                showThemedAlert(
                  'Library cleared',
                  'All books were removed from FReeder. Re-import a folder or individual EPUBs anytime.',
                );
              })
              .catch(error => {
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Could not clear the library.';
                showThemedAlert('Clear library failed', message);
              });
          },
        },
      ],
    });
  }, [books.length, clearLibrary]);

  return (
    <TabScreenLayout>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={[typography.displayTitle, { color: colors.onSurface }]}>
            Settings
          </Text>
          <Text
            style={[
              typography.body,
              styles.lead,
              { color: colors.onSurfaceVariant },
            ]}
          >
            FReeder is a local-first EPUB reader designed for eye comfort. Your
            library and progress stay securely on your device.
          </Text>
        </View>

        <View style={styles.block}>
          <SettingsSectionHeader icon="dark-mode" title="Appearance" />
          <SettingsAppearanceCard
            mode={appearanceMode}
            onChange={setAppearanceMode}
          />
        </View>

        <View style={styles.block}>
          <SettingsSectionHeader icon="auto-stories" title="Reading Defaults" />
          <SettingsReadingCard
            preferences={preferences}
            onChange={updatePreferences}
            onReset={handleResetReading}
          />
        </View>

        <View style={styles.block}>
          <SettingsSectionHeader icon="cloud-sync" title="Data & Backup" />
          <SettingsDataCard
            onBackupLocal={handleBackupLocal}
            onExportAnnotations={handleExportAllAnnotations}
            onExportFile={handleExportBackupFile}
            onImportFile={handleImportBackupFile}
            onRestoreLocal={handleRestoreLocal}
          />
        </View>

        <View style={styles.block}>
          <SettingsSectionHeader icon="insights" title="Reading Statistics" />
          {stats ? <SettingsStatisticsCard stats={stats} /> : null}
        </View>

        <View style={styles.block}>
          <SettingsSectionHeader
            icon="warning"
            title="Library Management"
            iconColor="#ba1a1a"
          />
          <SettingsLibraryCard
            hasLibraryFolder={Boolean(folderUri)}
            onClearLibrary={handleClearLibrary}
            onFindDuplicates={handleFindDuplicates}
            onRefreshLibrary={handleRefreshLibrary}
            onReextractCovers={handleReextractCovers}
          />
        </View>

        <SettingsAboutSection version={APP_VERSION} />
      </ScrollView>

      <FindDuplicatesModal
        books={books}
        visible={duplicatesVisible}
        onClose={() => setDuplicatesVisible(false)}
        onRemoveBook={handleRemoveDuplicate}
      />
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  intro: {
    gap: 12,
    marginBottom: 40,
  },
  lead: {
    lineHeight: 24,
    maxWidth: 520,
    opacity: 0.85,
  },
  block: {
    marginBottom: 48,
  },
});
