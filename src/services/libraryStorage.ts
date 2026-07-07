import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book } from '../types/book';

const FOLDER_KEY = '@freeder/libraryFolderUri';
const BOOKS_KEY = '@freeder/libraryBooks';

export async function loadLibraryFolderUri(): Promise<string | null> {
  return AsyncStorage.getItem(FOLDER_KEY);
}

export async function saveLibraryFolderUri(uri: string): Promise<void> {
  await AsyncStorage.setItem(FOLDER_KEY, uri);
}

function normalizeCachedBook(entry: unknown): Book | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const book = entry as Partial<Book>;
  if (!book.fileUrl || !book.fileName) {
    return null;
  }

  const fallbackTitle = book.fileName
    .replace(/\.epub$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: typeof book.id === 'string' && book.id.length > 0 ? book.id : book.fileUrl,
    title: book.title?.trim() || fallbackTitle || 'Untitled',
    author: book.author,
    fileUrl: book.fileUrl,
    fileName: book.fileName,
    coverUri: book.coverUri,
    addedAt: book.addedAt ?? Date.now(),
    missing: book.missing ?? false,
  };
}

export async function loadCachedBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(BOOKS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeCachedBook)
      .filter((book): book is Book => book !== null);
  } catch {
    return [];
  }
}

export async function saveCachedBooks(books: Book[]): Promise<void> {
  await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export async function clearLibraryStorage(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(FOLDER_KEY),
    AsyncStorage.removeItem(BOOKS_KEY),
  ]);
}
