export const COLORS = {
  // Vibrant midnight foundation
  background: '#07051A',
  backgroundDeep: '#0C0826',
  darkSurfaceDeep: '#07051A',
  darkSurface: '#100B31',
  ink: '#07051A',
  primaryDark: '#0B0824',
  primaryDeep: '#24105A',
  gradientBottom: '#07051A',
  gradientMid: '#28105E',
  gradientTop: '#5B22FF',

  // Cool glass neutrals
  pearl: '#F7F4FF',
  pearlDeep: '#E8E1FF',
  pearlSoft: 'rgba(247,244,255,0.10)',
  pearlPanel: '#F7F4FF',
  pearlBorder: 'rgba(217,104,255,0.28)',
  pearlText: '#201B3A',
  pearlSub: '#77708F',
  pearlMuted: '#9690AA',

  // Neon magenta accent
  champagne: '#FF4FD8',
  champagneSoft: 'rgba(255,79,216,0.14)',
  champagneBorder: 'rgba(255,79,216,0.38)',
  champagneDeep: '#C92DA7',

  // Electric violet / sapphire
  primary: '#7C3CFF',
  primarySoft: '#A979FF',
  primaryTint: 'rgba(124,60,255,0.16)',
  navyPanel: '#1A1044',
  royalPanel: '#5520D8',
  surface: '#110C31',
  card: '#110C31',
  cardRaised: '#1A1245',
  mistPanel: 'rgba(124,60,255,0.15)',
  blushPanel: 'rgba(255,79,216,0.12)',
  glass: 'rgba(20,12,50,0.72)',
  glassStrong: 'rgba(25,15,59,0.88)',
  glassBorder: 'rgba(184,145,255,0.22)',
  border: 'rgba(184,145,255,0.16)',

  // Cyan — scan / active / interactive
  cyan: '#35E8FF',
  cyanSoft: 'rgba(53,232,255,0.14)',
  skyPanel: '#35E8FF',
  violet: '#A66BFF',
  violetSoft: 'rgba(166,107,255,0.15)',

  textPrimary: '#F7F4FF',
  textSecondary: '#B8B1D8',
  textMuted: '#8078A7',
  textOnPrimary: '#FFFFFF',

  shadow: 'rgba(0,0,0,0.52)',
  shadowDeep: 'rgba(0,0,0,0.68)',
  neonGlow: 'rgba(53,232,255,0.24)',
  neonGlowDeep: 'rgba(124,60,255,0.42)',

  success: '#42E6A4',
  danger: '#FF6F9F',
  warning: '#FFD166',

  orbCore: '#FFFFFF',
  orbHighlight: '#F2E9FF',
  orbInner: '#C6A8FF',
  orbMid: '#9A63FF',
  orbOuter: '#7C3CFF',
  orbDeep: '#3A1590',
  orbDeepSoft: '#24105A',
  orbViolet: '#FF4FD8',
  orbCyan: '#35E8FF',
} as const;

export const SPACE = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  section: 38,
} as const;

export const RADIUS = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
  pill: 999,
} as const;
