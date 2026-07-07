import AsyncStorage from '@react-native-async-storage/async-storage';

import { generateBookId } from '../types/book';

const STORAGE_KEY = '@freeder/collections';

export type BookCollection = {
  id: string;
  name: string;
  bookIds: string[];
  createdAt: number;
};

export async function loadCollections(): Promise<BookCollection[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as BookCollection[];
  } catch {
    return [];
  }
}

export async function saveCollections(
  collections: BookCollection[],
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export async function createCollection(
  name: string,
): Promise<BookCollection[]> {
  const collections = await loadCollections();
  const trimmed = name.trim();
  if (!trimmed) {
    return collections;
  }
  const next: BookCollection = {
    id: generateBookId(),
    name: trimmed,
    bookIds: [],
    createdAt: Date.now(),
  };
  const updated = [...collections, next];
  await saveCollections(updated);
  return updated;
}

export async function renameCollection(
  id: string,
  name: string,
): Promise<BookCollection[]> {
  const collections = await loadCollections();
  const updated = collections.map(collection =>
    collection.id === id
      ? { ...collection, name: name.trim() || collection.name }
      : collection,
  );
  await saveCollections(updated);
  return updated;
}

export async function deleteCollection(id: string): Promise<BookCollection[]> {
  const collections = await loadCollections();
  const updated = collections.filter(collection => collection.id !== id);
  await saveCollections(updated);
  return updated;
}

export async function setBookCollections(
  bookId: string,
  collectionIds: string[],
): Promise<BookCollection[]> {
  const collections = await loadCollections();
  const idSet = new Set(collectionIds);
  const updated = collections.map(collection => {
    const has = collection.bookIds.includes(bookId);
    const shouldHave = idSet.has(collection.id);
    if (has === shouldHave) {
      return collection;
    }
    if (shouldHave) {
      return { ...collection, bookIds: [...collection.bookIds, bookId] };
    }
    return {
      ...collection,
      bookIds: collection.bookIds.filter(id => id !== bookId),
    };
  });
  await saveCollections(updated);
  return updated;
}

export async function removeBookFromAllCollections(
  bookId: string,
): Promise<void> {
  const collections = await loadCollections();
  const updated = collections.map(collection => ({
    ...collection,
    bookIds: collection.bookIds.filter(id => id !== bookId),
  }));
  await saveCollections(updated);
}
