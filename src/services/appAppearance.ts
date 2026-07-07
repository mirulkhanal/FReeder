import AsyncStorage from '@react-native-async-storage/async-storage';

const APPEARANCE_KEY = '@freeder/appAppearance';

export type AppAppearanceMode = 'light' | 'dark' | 'system';

export const DEFAULT_APP_APPEARANCE: AppAppearanceMode = 'system';

export async function loadAppAppearance(): Promise<AppAppearanceMode> {
  const raw = await AsyncStorage.getItem(APPEARANCE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return DEFAULT_APP_APPEARANCE;
}

export async function saveAppAppearance(mode: AppAppearanceMode): Promise<void> {
  await AsyncStorage.setItem(APPEARANCE_KEY, mode);
}
