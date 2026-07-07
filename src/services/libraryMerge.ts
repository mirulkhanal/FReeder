import { FileSystem } from 'react-native-file-access';
import type { Book } from '../types/book';
import {
  createBookFromScan,
  generateBookId,
  isLegacyPathBookId,
} from '../types/book';
import { migrateReadingStateId } from './readingProgress';

export type ScannedBookEntry = {
  fileUrl: string;
  fileName: string;
  title: string;
  author?: string;
};

function normalizeUrl(url: string): string {
  return decodeURIComponent(url);
}

async function fileExistsAtUrl(fileUrl: string): Promise<boolean> {
  try {
    const path = fileUrl.replace(/^file:\/\//, '');
    return await FileSystem.exists(path);
  } catch {
    return false;
  }
}

export async function migrateLegacyBooks(books: Book[]): Promise<Book[]> {
  const migrated: Book[] = [];
  for (const book of books) {
    const legacyId = book.id || book.fileUrl;
    if (isLegacyPathBookId(legacyId)) {
      const newId = generateBookId();
      await migrateReadingStateId(legacyId, newId);
      migrated.push({
        ...book,
        id: newId,
        addedAt: book.addedAt ?? Date.now(),
      });
      continue;
    }
    migrated.push({
      ...book,
      id: legacyId,
      addedAt: book.addedAt ?? Date.now(),
    });
  }
  return migrated;
}

export async function mergeScannedWithLibrary(
  scanned: ScannedBookEntry[],
  cached: Book[],
): Promise<Book[]> {
  const migratedCache = await migrateLegacyBooks(cached);
  const cachedByUrl = new Map(
    migratedCache.map(book => [normalizeUrl(book.fileUrl), book]),
  );
  const scannedUrls = new Set(scanned.map(entry => normalizeUrl(entry.fileUrl)));
  const merged: Book[] = [];

  for (const entry of scanned) {
    const existing = cachedByUrl.get(normalizeUrl(entry.fileUrl));
    if (existing) {
      merged.push({
        ...existing,
        fileUrl: entry.fileUrl,
        fileName: entry.fileName,
        title: existing.title || entry.title,
        missing: false,
      });
      continue;
    }

    const byFileName = migratedCache.find(
      book =>
        book.fileName === entry.fileName &&
        !merged.some(item => item.id === book.id),
    );
    if (byFileName) {
      merged.push({
        ...byFileName,
        fileUrl: entry.fileUrl,
        fileName: entry.fileName,
        title: byFileName.title || entry.title,
        missing: false,
      });
      continue;
    }

    merged.push(createBookFromScan(entry));
  }

  const mergedIds = new Set(merged.map(book => book.id));

  for (const book of migratedCache) {
    if (mergedIds.has(book.id)) {
      continue;
    }
    if (scannedUrls.has(normalizeUrl(book.fileUrl))) {
      continue;
    }
    const stillExists = await fileExistsAtUrl(book.fileUrl);
    merged.push({
      ...book,
      missing: !stillExists,
    });
  }

  return merged.sort((a, b) => a.title.localeCompare(b.title));
}

export function bookFromPickedFile(
  uri: string,
  name: string,
  title?: string,
): Book {
  const baseTitle =
    title ??
    name
      .replace(/\.epub$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return createBookFromScan({
    fileUrl: uri,
    fileName: name,
    title: baseTitle || 'Untitled',
  });
}
