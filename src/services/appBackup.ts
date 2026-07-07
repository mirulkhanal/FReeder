import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import { FileSystem } from 'react-native-file-access';
import { loadAllBookmarksMap } from './bookBookmarks';
import { loadAllHighlightsMap } from './bookAnnotations';
import { loadCollections } from './collectionsStorage';
import { loadCachedBooks } from './libraryStorage';
import { loadAllBookReaderPrefs } from './bookReaderPrefs';
import { loadReaderChromePrefs } from './readerChromePrefs';
import { loadReaderPreferences } from './readerPreferences';
import { loadReadingStatistics } from './readingStatistics';
import { loadAllReadingStates } from './readingProgress';
import { loadAppAppearance } from './appAppearance';

export const BACKUP_VERSION = 2;

export type AppBackupPayload = {
  version: number;
  exportedAt: number;
  books: Awaited<ReturnType<typeof loadCachedBooks>>;
  readingProgress: Awaited<ReturnType<typeof loadAllReadingStates>>;
  bookmarks: Awaited<ReturnType<typeof loadAllBookmarksMap>>;
  highlights: Awaited<ReturnType<typeof loadAllHighlightsMap>>;
  collections: Awaited<ReturnType<typeof loadCollections>>;
  readingStatistics: Awaited<ReturnType<typeof loadReadingStatistics>>;
  readerPreferences: Awaited<ReturnType<typeof loadReaderPreferences>>;
  readerChromePrefs: Awaited<ReturnType<typeof loadReaderChromePrefs>>;
  bookReaderPrefs: Awaited<ReturnType<typeof loadAllBookReaderPrefs>>;
  appAppearance: Awaited<ReturnType<typeof loadAppAppearance>>;
};

const LOCAL_BACKUP_KEY = '@freeder/appBackup';

async function buildBackupPayload(): Promise<AppBackupPayload> {
  const [
    books,
    readingProgress,
    bookmarks,
    highlights,
    collections,
    readingStatistics,
    readerPreferences,
    readerChromePrefs,
    bookReaderPrefs,
    appAppearance,
  ] = await Promise.all([
    loadCachedBooks(),
    loadAllReadingStates(),
    loadAllBookmarksMap(),
    loadAllHighlightsMap(),
    loadCollections(),
    loadReadingStatistics(),
    loadReaderPreferences(),
    loadReaderChromePrefs(),
    loadAllBookReaderPrefs(),
    loadAppAppearance(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    books,
    readingProgress,
    bookmarks,
    highlights,
    collections,
    readingStatistics,
    readerPreferences,
    readerChromePrefs,
    bookReaderPrefs,
    appAppearance,
  };
}

export async function exportLocalAppBackup(): Promise<AppBackupPayload> {
  const payload = await buildBackupPayload();
  await AsyncStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
  return payload;
}

export async function restoreLocalAppBackup(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LOCAL_BACKUP_KEY);
  if (!raw) {
    return false;
  }
  try {
    const payload = JSON.parse(raw) as AppBackupPayload;
    await applyAppBackup(payload);
    return true;
  } catch {
    return false;
  }
}

export async function applyAppBackup(payload: AppBackupPayload): Promise<void> {
  const { saveCachedBooks } = await import('./libraryStorage');
  const { saveAllReadingStates } = await import('./readingProgress');
  const { saveAllBookmarksMap } = await import('./bookBookmarks');
  const { saveAllHighlightsMap } = await import('./bookAnnotations');
  const { saveCollections } = await import('./collectionsStorage');
  const { saveReadingStatistics } = await import('./readingStatistics');
  const { saveReaderPreferences } = await import('./readerPreferences');
  const { saveReaderChromePrefs } = await import('./readerChromePrefs');
  const { saveAllBookReaderPrefs } = await import('./bookReaderPrefs');
  const { saveAppAppearance } = await import('./appAppearance');

  await Promise.all([
    saveCachedBooks(payload.books ?? []),
    saveAllReadingStates(payload.readingProgress ?? {}),
    saveAllBookmarksMap(payload.bookmarks ?? {}),
    saveAllHighlightsMap(payload.highlights ?? {}),
    saveCollections(payload.collections ?? []),
    saveReadingStatistics(payload.readingStatistics),
    saveReaderPreferences(payload.readerPreferences),
    saveReaderChromePrefs(payload.readerChromePrefs),
    saveAllBookReaderPrefs(payload.bookReaderPrefs ?? {}),
    saveAppAppearance(payload.appAppearance),
  ]);
}

export async function exportAppBackupToFile(): Promise<string> {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  await exportLocalAppBackup();
  return json;
}

export async function pickAndImportAppBackup(): Promise<boolean> {
  const [file] = await pick({
    mode: 'open',
    type: [types.json, types.plainText, types.allFiles],
  });
  if (!file?.uri) {
    return false;
  }

  const [copy] = await keepLocalCopy({
    files: [{ uri: file.uri, fileName: file.name ?? 'freeder-backup.json' }],
    destination: 'cachesDirectory',
  });

  const path = copy?.localUri ?? file.uri;
  const raw = await FileSystem.readFile(path.replace(/^file:\/\//, ''), 'utf8');
  const payload = JSON.parse(raw) as AppBackupPayload;
  if (!payload?.version) {
    throw new Error('Invalid FReeder backup file.');
  }
  await applyAppBackup(payload);
  await exportLocalAppBackup();
  return true;
}
