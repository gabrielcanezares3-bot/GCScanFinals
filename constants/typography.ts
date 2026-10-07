import { Platform } from 'react-native';

export const TYPOGRAPHY = {
  fontFamily: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
    default: 'sans-serif',
  }) ?? 'sans-serif',
  display: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800' as const,
    letterSpacing: -1.1,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.7,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.15,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  stat: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
} as const;
