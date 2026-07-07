import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freeder/readerChromePrefs';

export type TapZoneAction = 'prev' | 'next' | 'menu' | 'none';

export type TapZones = {
  left: TapZoneAction;
  center: TapZoneAction;
  right: TapZoneAction;
};

export type ReaderChromePrefs = {
  tapZones: TapZones;
  brightnessOverlay: number;
  blueLightFilter: boolean;
  autoScrollWpm: number;
};

export const DEFAULT_READER_CHROME_PREFS: ReaderChromePrefs = {
  tapZones: { left: 'prev', center: 'menu', right: 'next' },
  brightnessOverlay: 0,
  blueLightFilter: false,
  autoScrollWpm: 0,
};

export async function loadReaderChromePrefs(): Promise<ReaderChromePrefs> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_READER_CHROME_PREFS;
  }
  try {
    return { ...DEFAULT_READER_CHROME_PREFS, ...(JSON.parse(raw) as ReaderChromePrefs) };
  } catch {
    return DEFAULT_READER_CHROME_PREFS;
  }
}

export async function saveReaderChromePrefs(prefs: ReaderChromePrefs): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
