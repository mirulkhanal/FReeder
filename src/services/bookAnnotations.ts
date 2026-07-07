import type { Decoration } from 'react-native-readium';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freeder/bookHighlights';

type HighlightMap = Record<string, Decoration[]>;

async function loadMap(): Promise<HighlightMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as HighlightMap;
  } catch {
    return {};
  }
}

async function saveMap(map: HighlightMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function loadHighlights(bookId: string): Promise<Decoration[]> {
  const map = await loadMap();
  return map[bookId] ?? [];
}

export async function saveHighlights(
  bookId: string,
  highlights: Decoration[],
): Promise<void> {
  const map = await loadMap();
  map[bookId] = highlights;
  await saveMap(map);
}

export async function loadAllHighlightsMap(): Promise<HighlightMap> {
  return loadMap();
}

export async function saveAllHighlightsMap(map: HighlightMap): Promise<void> {
  await saveMap(map);
}

export async function removeHighlightsForBook(bookId: string): Promise<void> {
  const map = await loadMap();
  if (!(bookId in map)) {
    return;
  }
  delete map[bookId];
  await saveMap(map);
}
