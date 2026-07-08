import { FileSystem } from 'react-native-file-access';

import { getBookFileName } from '../types/book';

import type { Book } from '../types/book';

function stripScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

export async function hashBookFile(book: Book): Promise<string | null> {
  try {
    const path = stripScheme(book.fileUrl);
    if (!(await FileSystem.exists(path))) {
      return null;
    }
    return await FileSystem.hash(path, 'SHA-256');
  } catch {
    return null;
  }
}

export type DuplicateGroup = {
  hash: string;
  books: Book[];
};

export async function findDuplicateBooks(
  books: Book[],
): Promise<DuplicateGroup[]> {
  const byHash = new Map<string, Book[]>();

  for (const book of books) {
    if (book.missing) {
      continue;
    }
    const hash = book.contentHash ?? (await hashBookFile(book));
    if (!hash) {
      continue;
    }
    const group = byHash.get(hash) ?? [];
    group.push(book);
    byHash.set(hash, group);
  }

  return [...byHash.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([hash, group]) => ({ hash, books: group }));
}

export function findFilenameDuplicates(books: Book[]): Book[][] {
  const byName = new Map<string, Book[]>();
  for (const book of books) {
    const key = getBookFileName(book).toLowerCase();
    const group = byName.get(key) ?? [];
    group.push(book);
    byName.set(key, group);
  }
  return [...byName.values()].filter(group => group.length > 1);
}

export async function findTitleSizeDuplicates(
  books: Book[],
): Promise<Book[][]> {
  const byKey = new Map<string, Book[]>();

  for (const book of books) {
    if (book.missing) {
      continue;
    }
    try {
      const path = book.fileUrl.replace(/^file:\/\//, '');
      if (!(await FileSystem.exists(path))) {
        continue;
      }
      const stat = await FileSystem.stat(path);
      const size = stat.size ?? 0;
      if (size <= 0) {
        continue;
      }
      const key = `${book.title.trim().toLowerCase()}::${size}`;
      const group = byKey.get(key) ?? [];
      group.push(book);
      byKey.set(key, group);
    } catch {
      // Skip unreadable files.
    }
  }

  return [...byKey.values()].filter(group => group.length > 1);
}
