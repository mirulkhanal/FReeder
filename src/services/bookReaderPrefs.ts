import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReaderPreferences } from './readerPreferences';

const STORAGE_KEY = '@freeder/bookReaderPrefs';

type BookPrefsMap = Record<string, Partial<ReaderPreferences>>;

export async function loadAllBookReaderPrefs(): Promise<BookPrefsMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as BookPrefsMap;
  } catch {
    return {};
  }
}

export async function saveAllBookReaderPrefs(map: BookPrefsMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function loadBookReaderPrefs(
  bookId: string,
): Promise<Partial<ReaderPreferences> | null> {
  const map = await loadAllBookReaderPrefs();
  return map[bookId] ?? null;
}

export async function saveBookReaderPrefs(
  bookId: string,
  prefs: Partial<ReaderPreferences>,
): Promise<void> {
  const map = await loadAllBookReaderPrefs();
  map[bookId] = prefs;
  await saveAllBookReaderPrefs(map);
}

export async function clearBookReaderPrefs(bookId: string): Promise<void> {
  const map = await loadAllBookReaderPrefs();
  delete map[bookId];
  await saveAllBookReaderPrefs(map);
}
