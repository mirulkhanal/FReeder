import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Locator } from 'react-native-readium';

const STORAGE_KEY = '@freeder/bookBookmarks';

export type BookBookmark = {
  id: string;
  locator: Locator;
  label: string;
  createdAt: number;
  progress: number;
};

type BookmarkMap = Record<string, BookBookmark[]>;

async function loadMap(): Promise<BookmarkMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as BookmarkMap;
  } catch {
    return {};
  }
}

async function saveMap(map: BookmarkMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function loadBookmarks(bookId: string): Promise<BookBookmark[]> {
  const map = await loadMap();
  return map[bookId] ?? [];
}

export async function saveBookmarks(
  bookId: string,
  bookmarks: BookBookmark[],
): Promise<void> {
  const map = await loadMap();
  map[bookId] = bookmarks;
  await saveMap(map);
}

export async function addBookmark(
  bookId: string,
  bookmark: BookBookmark,
): Promise<BookBookmark[]> {
  const existing = await loadBookmarks(bookId);
  const next = [bookmark, ...existing];
  await saveBookmarks(bookId, next);
  return next;
}

export async function removeBookmark(
  bookId: string,
  bookmarkId: string,
): Promise<BookBookmark[]> {
  const existing = await loadBookmarks(bookId);
  const next = existing.filter(entry => entry.id !== bookmarkId);
  await saveBookmarks(bookId, next);
  return next;
}

export async function loadAllBookmarksMap(): Promise<BookmarkMap> {
  return loadMap();
}

export async function saveAllBookmarksMap(map: BookmarkMap): Promise<void> {
  await saveMap(map);
}

export async function removeBookmarksForBook(bookId: string): Promise<void> {
  const map = await loadMap();
  if (!(bookId in map)) {
    return;
  }
  delete map[bookId];
  await saveMap(map);
}
