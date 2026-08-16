/**
 * TypeScript mirror of tokens.css for React Native (and any JS-consumed
 * styling). If you change a value here, change it there — same names.
 */

export interface Theme {
  bg: string
  surface: string
  surface2: string
  primary: string
  primarySoft: string
  accent: string
  accentSoft: string
  text: string
  text2: string
  text3: string
  border: string
  borderMid: string
}

export const lightTheme: Theme = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  accent: '#22C55E',
  accentSoft: '#DCFCE7',
  text: '#0F172A',
  text2: '#64748B',
  text3: '#94A3B8',
  border: 'rgba(15, 23, 42, 0.07)',
  borderMid: 'rgba(15, 23, 42, 0.12)',
}

export const darkTheme: Theme = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#263448',
  primary: '#818CF8',
  primarySoft: '#1E1B4B',
  accent: '#22C55E',
  accentSoft: '#052E16',
  text: '#F8FAFC',
  text2: '#94A3B8',
  text3: '#64748B',
  border: 'rgba(248, 250, 252, 0.07)',
  borderMid: 'rgba(248, 250, 252, 0.12)',
}

export function theme(dark: boolean): Theme {
  return dark ? darkTheme : lightTheme
}

/** Corner radii in px, matching the CSS --radius* tokens. */
export const radii = { xs: 6, sm: 10, md: 16, lg: 20, pill: 999 } as const

/** Loyalty tier accents from the prototype's CustomerScreen. */
export const tierColors = {
  silver: '#64748B',
  gold: '#F59E0B',
  platinum: '#818CF8',
} as const

/** Status colors used for stock badges and deltas. */
export const statusColors = {
  ok: '#166534',
  okBg: '#DCFCE7',
  warn: '#92400E',
  warnBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  positive: '#22C55E',
  negative: '#EF4444',
} as const
