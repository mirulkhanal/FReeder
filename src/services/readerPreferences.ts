import type { Preferences } from 'react-native-readium';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@freeder/readerPreferences';

export type ReaderTheme = 'light' | 'dark' | 'sepia';

/** How pages advance in the reader. Readium does not expose separate curl vs slide animations. */
export type ReadingMode = 'paginated' | 'scroll' | 'two-page';

export type SpreadMode = NonNullable<Preferences['spread']>;

export type ImageFilterMode = 'none' | NonNullable<Preferences['imageFilter']>;

export type ReaderPreferences = {
  theme: ReaderTheme;
  fontFamily: NonNullable<Preferences['fontFamily']>;
  fontSize: number;
  lineHeight: number;
  pageMargins: number;
  publisherStyles: boolean;
  readingMode: ReadingMode;
  textAlign: NonNullable<Preferences['textAlign']>;
  hyphens: boolean;
  letterSpacing: number;
  spread: SpreadMode;
  imageFilter: ImageFilterMode;
  /** @deprecated use readingMode === 'scroll' */
  scroll?: boolean;
};

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  theme: 'light',
  fontFamily: 'serif',
  fontSize: 1.15,
  lineHeight: 1.6,
  pageMargins: 1.5,
  publisherStyles: true,
  readingMode: 'paginated',
  textAlign: 'justify',
  hyphens: false,
  letterSpacing: 0,
  spread: 'auto',
  imageFilter: 'none',
};

const THEME_COLORS: Record<
  ReaderTheme,
  { backgroundColor: string; textColor: string }
> = {
  light: { backgroundColor: '#f9f9fb', textColor: '#1a1c1d' },
  sepia: { backgroundColor: '#f4ecd8', textColor: '#3d3428' },
  dark: { backgroundColor: '#1a1c1d', textColor: '#f0f0f2' },
};

export async function loadReaderPreferences(): Promise<ReaderPreferences> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) {
    return DEFAULT_READER_PREFERENCES;
  }
  try {
    const stored = JSON.parse(raw) as Partial<ReaderPreferences> & { scroll?: boolean };
    const readingMode =
      stored.readingMode ??
      (stored.scroll ? 'scroll' : DEFAULT_READER_PREFERENCES.readingMode);
    return {
      ...DEFAULT_READER_PREFERENCES,
      ...stored,
      readingMode,
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export async function saveReaderPreferences(
  prefs: ReaderPreferences,
): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function resetReaderPreferences(): Promise<ReaderPreferences> {
  await saveReaderPreferences(DEFAULT_READER_PREFERENCES);
  return DEFAULT_READER_PREFERENCES;
}

export function readerPreferencesToReadium(
  prefs: ReaderPreferences,
): Preferences {
  const colors = THEME_COLORS[prefs.theme];
  const base: Preferences = {
    theme: prefs.theme,
    backgroundColor: colors.backgroundColor,
    textColor: colors.textColor,
    fontFamily: prefs.fontFamily,
    fontSize: prefs.fontSize,
    typeScale: prefs.fontSize,
    lineHeight: prefs.lineHeight,
    pageMargins: prefs.pageMargins,
    publisherStyles: prefs.publisherStyles,
    textAlign: prefs.textAlign,
    hyphens: prefs.hyphens,
    letterSpacing: prefs.letterSpacing,
  };

  if (prefs.theme === 'dark' && prefs.imageFilter !== 'none') {
    base.imageFilter = prefs.imageFilter;
  }

  if (prefs.readingMode === 'scroll') {
    return { ...base, scroll: true };
  }

  if (prefs.readingMode === 'two-page') {
    return { ...base, scroll: false, columnCount: '2', spread: prefs.spread };
  }

  return { ...base, scroll: false, columnCount: '1' };
}
