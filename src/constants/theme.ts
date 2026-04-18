import { ColorSchemeName } from 'react-native'

// ─────────────────────────────────────────
// PALETA DE COLORES
// ─────────────────────────────────────────

const palette = {
  indigo50:  '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo300: '#A5B4FC',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  amber400: '#FBBF24',
  amber500: '#F59E0B',

  red400:    '#F87171',
  red500:    '#EF4444',

  orange400: '#FB923C',
  orange500: '#F97316',

  gray50:   '#F9FAFB',
  gray100:  '#F3F4F6',
  gray200:  '#E5E7EB',
  gray300:  '#D1D5DB',
  gray400:  '#9CA3AF',
  gray500:  '#6B7280',
  gray600:  '#4B5563',
  gray700:  '#374151',
  gray800:  '#1F2937',
  gray900:  '#111827',

  white: '#FFFFFF',
  black: '#000000',

  dark0:  '#0F0F0F',
  dark1:  '#1A1A1A',
  dark2:  '#242424',
  dark3:  '#2E2E2E',
  dark4:  '#3A3A3A',
}

// ─────────────────────────────────────────
// TEMAS
// ─────────────────────────────────────────

export const lightTheme = {
  colors: {
    primary:       palette.indigo500,
    primaryLight:  palette.indigo100,
    primaryDark:   palette.indigo700,
    secondary:     palette.emerald500,
    secondaryLight: palette.emerald400,

    background:    palette.white,
    surface:       palette.gray50,
    card:          palette.white,
    border:        palette.gray200,
    divider:       palette.gray100,

    text:          palette.gray900,
    textSecondary: palette.gray500,
    textDisabled:  palette.gray300,
    textInverse:   palette.white,

    success:       palette.emerald500,
    warning:       palette.amber500,
    error:         palette.red500,
    info:          palette.indigo500,

    xpBar:         palette.amber400,
    streak:        palette.orange500,

    heatmap: {
      empty:  palette.gray200,
      low:    palette.indigo100,
      medium: palette.indigo400,
      high:   palette.indigo600,
    },

    scoreRing: {
      low:    palette.red400,
      mid:    palette.amber400,
      high:   palette.emerald400,
      track:  palette.gray200,
    },

    tabBar:        palette.white,
    tabBarBorder:  palette.gray200,
    tabActive:     palette.indigo500,
    tabInactive:   palette.gray400,

    overlay:       'rgba(0,0,0,0.4)',
    backdrop:      'rgba(0,0,0,0.5)',
  },
  isDark: false,
}

export const darkTheme = {
  colors: {
    primary:       palette.indigo400,
    primaryLight:  palette.indigo700,
    primaryDark:   palette.indigo300,
    secondary:     palette.emerald400,
    secondaryLight: palette.emerald400,

    background:    palette.dark0,
    surface:       palette.dark1,
    card:          palette.dark2,
    border:        palette.dark3,
    divider:       palette.dark2,

    text:          '#F5F5F5',
    textSecondary: '#A0A0A0',
    textDisabled:  palette.dark4,
    textInverse:   palette.dark0,

    success:       palette.emerald400,
    warning:       palette.amber400,
    error:         palette.red400,
    info:          palette.indigo400,

    xpBar:         palette.amber400,
    streak:        palette.orange400,

    heatmap: {
      empty:  palette.dark3,
      low:    palette.indigo700,
      medium: palette.indigo500,
      high:   palette.indigo300,
    },

    scoreRing: {
      low:    palette.red400,
      mid:    palette.amber400,
      high:   palette.emerald400,
      track:  palette.dark3,
    },

    tabBar:        palette.dark1,
    tabBarBorder:  palette.dark2,
    tabActive:     palette.indigo400,
    tabInactive:   palette.gray500,

    overlay:       'rgba(0,0,0,0.6)',
    backdrop:      'rgba(0,0,0,0.7)',
  },
  isDark: true,
}

export type AppTheme = typeof darkTheme

export function getTheme(scheme: ColorSchemeName): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme
}

// ─────────────────────────────────────────
// ESPACIADO Y RADIOS
// ─────────────────────────────────────────

export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
}

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 9999,
}

// ─────────────────────────────────────────
// TIPOGRAFÍA
// ─────────────────────────────────────────

export const typography = {
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    xxxl: 32,
    hero: 40,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.75,
  },
}

// ─────────────────────────────────────────
// SOMBRAS
// ─────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
}

// ─────────────────────────────────────────
// COLORES DE HÁBITOS (opciones para el usuario)
// ─────────────────────────────────────────

export const HABIT_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
]

// ─────────────────────────────────────────
// ICONOS DE HÁBITOS (Expo vector icons)
// ─────────────────────────────────────────

export const HABIT_ICONS = [
  { key: 'star',        label: 'Estrella' },
  { key: 'fitness',     label: 'Fitness' },
  { key: 'book',        label: 'Lectura' },
  { key: 'water',       label: 'Agua' },
  { key: 'sleep',       label: 'Sueño' },
  { key: 'meditation',  label: 'Meditación' },
  { key: 'run',         label: 'Correr' },
  { key: 'food',        label: 'Nutrición' },
  { key: 'code',        label: 'Código' },
  { key: 'music',       label: 'Música' },
  { key: 'heart',       label: 'Salud' },
  { key: 'brain',       label: 'Aprender' },
]
