export const COLORS = {
  // 60% — Midnight navy foundation (dominant)
  background: '#060A24',
  backgroundDeep: '#0A1038',
  darkSurfaceDeep: '#060A24',
  darkSurface: '#0D1440',
  ink: '#060A24',
  primaryDark: '#080D2E',
  primaryDeep: '#141C52',
  gradientBottom: '#080D2E',
  gradientMid: '#1B2A70',
  gradientTop: '#2B49F5',

  // 30% — Pearl / warm neutral (sophisticated contrast, not generic white)
  pearl: '#F6F1E6',
  pearlDeep: '#EAE1CC',
  pearlSoft: 'rgba(246,241,230,0.10)',
  pearlPanel: '#F6F1E6',
  pearlBorder: 'rgba(227,183,111,0.32)',
  pearlText: '#1B2148',
  pearlSub: '#5D6178',
  pearlMuted: '#8A8CA0',

  // 10% — Champagne gold (luxury accent, brushed metal warmth)
  champagne: '#E3B76F',
  champagneSoft: 'rgba(227,183,111,0.14)',
  champagneBorder: 'rgba(227,183,111,0.38)',
  champagneDeep: '#9A7E4F',
  // Royal / sapphire (60% family — main surfaces)
  primary: '#315EFF',
  primarySoft: '#8298FF',
  primaryTint: 'rgba(49,94,255,0.14)',
  navyPanel: '#141C52',
  royalPanel: '#2B49F5',
  surface: '#101743',
  card: '#101743',
  cardRaised: '#16205A',
  mistPanel: 'rgba(49,94,255,0.14)',
  blushPanel: 'rgba(144,98,255,0.14)',
  glass: 'rgba(20,28,82,0.72)',
  glassStrong: 'rgba(22,32,90,0.88)',
  glassBorder: 'rgba(130,152,255,0.22)',
  border: 'rgba(130,152,255,0.18)',

  // Functional cyan — scan / active / interactive only (not the luxury accent)
  cyan: '#38E1FF',
  cyanSoft: 'rgba(56,225,255,0.14)',
  skyPanel: '#38E1FF',
  violet: '#9062FF',
  violetSoft: 'rgba(144,98,255,0.14)',

  // Text — high contrast on midnight
  textPrimary: '#F2F5FF',
  textSecondary: '#A6B0D8',
  textMuted: '#7A86B8',
  textOnPrimary: '#FFFFFF',

  shadow: 'rgba(2,4,18,0.55)',
  shadowDeep: 'rgba(2,4,18,0.65)',
  neonGlow: 'rgba(56,225,255,0.22)',
  neonGlowDeep: 'rgba(43,73,245,0.35)',

  success: '#3DDC97',
  danger: '#FF7A9B',
  warning: '#FFC24B',

  orbCore: '#FFFFFF',
  orbHighlight: '#DCE6FF',
  orbInner: '#A5B5FF',
  orbMid: '#718FFF',
  orbOuter: '#315EFF',
  orbDeep: '#1B2A70',
  orbDeepSoft: '#141C52',
  orbViolet: '#9062FF',
  orbCyan: '#38E1FF',
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
