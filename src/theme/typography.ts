import { Platform, type TextStyle } from 'react-native';

const serif = (weight: TextStyle['fontWeight']): TextStyle =>
  Platform.select({
    ios: { fontFamily: 'Georgia', fontWeight: weight },
    android: { fontFamily: 'serif', fontWeight: weight },
    default: { fontFamily: 'serif', fontWeight: weight },
  }) ?? { fontWeight: weight };

const sans = (weight: TextStyle['fontWeight']): TextStyle =>
  Platform.select({
    ios: { fontWeight: weight },
    android: { fontFamily: 'sans-serif', fontWeight: weight },
    default: { fontWeight: weight },
  }) ?? { fontWeight: weight };

export const typography = {
  appTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.44,
    ...serif('700'),
  },
  displayTitle: {
    fontSize: 34,
    lineHeight: 44,
    letterSpacing: -0.68,
    ...serif('700'),
  },
  headlineLg: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
    ...serif('600'),
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.25,
    ...serif('600'),
  },
  titleMd: {
    fontSize: 18,
    lineHeight: 24,
    ...sans('600'),
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    ...sans('400'),
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    ...sans('500'),
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14,
    ...sans('600'),
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    ...sans('500'),
  },
};
