import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { paletteToTheme, type ThemeColors } from './colors';
import { radius } from './spacing';
import { serene, sereneDark } from './sereneColors';
import { typography } from './typography';
import {
  DEFAULT_APP_APPEARANCE,
  loadAppAppearance,
  saveAppAppearance,
  type AppAppearanceMode,
} from '../services/appAppearance';

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  appearanceMode: AppAppearanceMode;
  setAppearanceMode: (mode: AppAppearanceMode) => void;
  typography: typeof typography;
  radius: typeof radius;
};

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [appearanceMode, setAppearanceModeState] = useState<AppAppearanceMode>(
    DEFAULT_APP_APPEARANCE,
  );

  useEffect(() => {
    void loadAppAppearance().then(setAppearanceModeState);
  }, []);

  const setAppearanceMode = useCallback((mode: AppAppearanceMode) => {
    setAppearanceModeState(mode);
    void saveAppAppearance(mode);
  }, []);

  const isDark =
    appearanceMode === 'dark' ||
    (appearanceMode === 'system' && systemScheme === 'dark');

  const theme = useMemo<Theme>(
    () => ({
      colors: paletteToTheme(isDark ? sereneDark : serene, isDark),
      isDark,
      appearanceMode,
      setAppearanceMode,
      typography,
      radius,
    }),
    [appearanceMode, isDark, setAppearanceMode],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}
