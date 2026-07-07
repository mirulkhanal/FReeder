import { FileSystem } from 'react-native-file-access';
import type { Book } from '../types/book';
import { getBookFileName } from '../types/book';
import { clearCachedBookCopy } from './bookFile';
import { clearCachedCoverForBook } from './epubCover';
import { clearAllReadingStates, removeReadingState } from './readingProgress';
import { clearLibraryStorage } from './libraryStorage';
import { removeBookmarksForBook } from './bookBookmarks';
import { removeHighlightsForBook } from './bookAnnotations';
import { removeBookFromAllCollections } from './collectionsStorage';
import { clearBookReaderPrefs } from './bookReaderPrefs';

function stripFileScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

async function deleteFileAtPath(path: string): Promise<void> {
  try {
    await FileSystem.unlink(path);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not delete the book file.';
    throw new Error(message);
  }
}

async function clearBookCaches(book: Book): Promise<void> {
  await clearCachedBookCopy(book.fileUrl, book.fileName);
  await clearCachedCoverForBook(book.fileUrl);

  if (book.coverUri?.startsWith('file://')) {
    const coverPath = stripFileScheme(book.coverUri);
    if (await FileSystem.exists(coverPath)) {
      try {
        await FileSystem.unlink(coverPath);
      } catch {
        // Best-effort cover cleanup.
      }
    }
  }
}

async function clearBookAnnotations(book: Book): Promise<void> {
  await Promise.all([
    removeBookmarksForBook(book.id),
    removeHighlightsForBook(book.id),
    removeBookFromAllCollections(book.id),
    clearBookReaderPrefs(book.id),
  ]);
}

/** Removes from library and clears caches but keeps the file on disk. */
export async function removeBookFromLibrary(book: Book): Promise<void> {
  await clearBookCaches(book);
  await clearBookAnnotations(book);
  await removeReadingState(book.id);
}

/** Clears the entire library from the app without deleting EPUB files on disk. */
export async function clearLibraryKeepingFiles(books: Book[]): Promise<void> {
  await Promise.all(books.map(book => clearBookCaches(book)));
  await clearAllReadingStates();
  await clearLibraryStorage();
}

/** Permanently deletes the EPUB file and all related app data. */
export async function deleteBookFromDevice(book: Book): Promise<void> {
  await deleteFileAtPath(stripFileScheme(book.fileUrl));
  await clearBookCaches(book);
  await clearBookAnnotations(book);
  await removeReadingState(book.id);
}

export type BookOpenErrorCode =
  | 'permission'
  | 'missing'
  | 'unsupported'
  | 'corrupt'
  | 'storage'
  | 'unknown';

export function classifyBookOpenError(error: unknown): {
  code: BookOpenErrorCode;
  message: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('permission') || lower.includes('eacces') || lower.includes('security')) {
    return {
      code: 'permission',
      message:
        'FReeder no longer has permission to open this book. Use “Locate file” in the library or re-select your books folder.',
    };
  }
  if (lower.includes('enoent') || lower.includes('not found') || lower.includes('no such file')) {
    return {
      code: 'missing',
      message: 'This book file could not be found. It may have been moved or deleted.',
    };
  }
  if (lower.includes('pdf')) {
    return {
      code: 'unsupported',
      message: 'FReeder supports EPUB only. PDF files cannot be opened.',
    };
  }
  if (lower.includes('space') || lower.includes('enospc') || lower.includes('storage')) {
    return {
      code: 'storage',
      message: 'Not enough storage space to open this book.',
    };
  }
  if (lower.includes('zip') || lower.includes('epub') || lower.includes('parse') || lower.includes('corrupt')) {
    return {
      code: 'corrupt',
      message: 'This EPUB file appears to be damaged or unsupported.',
    };
  }

  return {
    code: 'unknown',
    message: raw || 'Could not open this book.',
  };
}

export async function verifyBookAccessible(book: Book): Promise<boolean> {
  if (book.missing) {
    return false;
  }
  if (!getBookFileName(book).toLowerCase().endsWith('.epub')) {
    return false;
  }
  try {
    if (book.fileUrl.startsWith('content://')) {
      return await FileSystem.exists(book.fileUrl);
    }
    const path = stripFileScheme(book.fileUrl);
    return await FileSystem.exists(path);
  } catch {
    return false;
  }
}
