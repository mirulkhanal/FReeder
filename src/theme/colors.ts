import type { SerenePalette } from './sereneColors';

export type ThemeColors = SerenePalette & {
  text: string;
  textMuted: string;
  accent: string;
  accentPressed: string;
  border: string;
  error: string;
  tabBar: string;
  tabBarBorder: string;
};

export function paletteToTheme(p: SerenePalette, isDark = false): ThemeColors {
  return {
    ...p,
    text: p.onSurface,
    textMuted: p.onSurfaceVariant,
    accent: p.primary,
    accentPressed: p.onPrimaryFixedVariant,
    border: p.outlineVariant,
    error: '#ba1a1a',
    tabBar: isDark ? p.surfaceContainerLowest : p.background,
    tabBarBorder: isDark ? p.outlineVariant : 'transparent',
  };
}
