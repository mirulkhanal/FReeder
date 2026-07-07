import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Locator } from 'react-native-readium';

const PROGRESS_KEY = '@freeder/readingProgress';
const PROGRESS_BACKUP_KEY = '@freeder/readingProgressBackup';

export type StoredLocator = Locator;

export type ReadingState = {
  bookId: string;
  progress: number;
  lastOpenedAt: number;
  title?: string;
  author?: string;
  locator?: StoredLocator;
  favorite?: boolean;
  finished?: boolean;
};

type ProgressMap = Record<string, ReadingState>;

async function loadMap(): Promise<ProgressMap> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

async function saveMap(map: ProgressMap): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export async function loadAllReadingStates(): Promise<ProgressMap> {
  return loadMap();
}

export async function saveReadingState(state: ReadingState): Promise<void> {
  const map = await loadMap();
  const existing = map[state.bookId];
  map[state.bookId] = {
    ...existing,
    ...state,
    favorite: state.favorite ?? existing?.favorite,
    finished: state.finished ?? existing?.finished,
  };
  await saveMap(map);
}

export async function getReadingState(
  bookId: string,
): Promise<ReadingState | null> {
  const map = await loadMap();
  return map[bookId] ?? null;
}

export async function removeReadingState(bookId: string): Promise<void> {
  const map = await loadMap();
  if (!(bookId in map)) {
    return;
  }
  delete map[bookId];
  await saveMap(map);
}

export async function clearAllReadingStates(): Promise<void> {
  await AsyncStorage.removeItem(PROGRESS_KEY);
}

export async function migrateReadingStateId(
  oldBookId: string,
  newBookId: string,
): Promise<void> {
  if (oldBookId === newBookId) {
    return;
  }
  const map = await loadMap();
  const existing = map[oldBookId];
  if (!existing) {
    return;
  }
  delete map[oldBookId];
  map[newBookId] = { ...existing, bookId: newBookId };
  await saveMap(map);
}

export async function updateReadingFlags(
  bookId: string,
  flags: Partial<Pick<ReadingState, 'favorite' | 'finished'>>,
): Promise<ReadingState | null> {
  const map = await loadMap();
  const existing = map[bookId];
  if (!existing) {
    return null;
  }
  const next = { ...existing, ...flags };
  map[bookId] = next;
  await saveMap(map);
  return next;
}

export async function exportReadingStatesBackup(): Promise<string> {
  const map = await loadMap();
  const payload = JSON.stringify(map, null, 2);
  await AsyncStorage.setItem(PROGRESS_BACKUP_KEY, payload);
  return payload;
}

/** @deprecated Use exportLocalAppBackup from appBackup.ts */

export async function restoreReadingStatesBackup(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(PROGRESS_BACKUP_KEY);
  if (!raw) {
    return false;
  }
  try {
    const map = JSON.parse(raw) as ProgressMap;
    await saveMap(map);
    return true;
  } catch {
    return false;
  }
}

export async function saveAllReadingStates(map: ProgressMap): Promise<void> {
  await saveMap(map);
}

export function progressFromLocator(locator: Locator): number {
  return (
    locator.locations?.totalProgression ?? locator.locations?.progression ?? 0
  );
}

export function isBookFinished(state?: ReadingState | null): boolean {
  if (!state) {
    return false;
  }
  if (state.finished) {
    return true;
  }
  return state.progress >= 0.98;
}

export function isBookInProgress(state?: ReadingState | null): boolean {
  if (!state) {
    return false;
  }
  if (isBookFinished(state)) {
    return false;
  }
  return state.progress > 0 || Boolean(state.lastOpenedAt);
}
