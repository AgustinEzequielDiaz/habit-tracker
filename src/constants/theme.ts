import { ColorSchemeName } from 'react-native'

// ─────────────────────────────────────────
// PALETA DE COLORES — Violet Warm (V2.2)
// Filosofía: personal, cálida, menos corporativa.
// Violet reemplaza a Indigo. Fondo cream en lugar de blanco puro.
// ─────────────────────────────────────────

const palette = {
  // Violeta — color principal (más cálido que el indigo anterior)
  violet50:  '#F5F3FF',
  violet100: '#EDE9FE',
  violet200: '#DDD6FE',
  violet300: '#C4B5FD',
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet600: '#7C3AED',
  violet700: '#6D28D9',
  violet800: '#5B21B6',

  // Rosa/Celebration — para logros, días perfectos, estados especiales
  pink300: '#F9A8D4',
  pink400: '#F472B6',
  pink500: '#EC4899',

  // Esmeralda — success, completions
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',

  // Amber — XP, rewards
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  // Rojo — error
  red400:    '#F87171',
  red500:    '#EF4444',

  // Naranja — streak, energía
  orange400: '#FB923C',
  orange500: '#F97316',

  // Grises cálidos (base warm, no el gris frío de Tailwind puro)
  warmGray50:   '#FAFAF9',
  warmGray100:  '#F5F5F4',
  warmGray200:  '#E7E5E4',
  warmGray300:  '#D6D3D1',
  warmGray400:  '#A8A29E',
  warmGray500:  '#78716C',
  warmGray600:  '#57534E',
  warmGray700:  '#44403C',
  warmGray800:  '#292524',
  warmGray900:  '#1C1917',

  white: '#FFFFFF',
  black: '#000000',

  // Oscuros — para dark mode (ligeramente más cálidos que neutros puros)
  dark0:  '#110F0E',
  dark1:  '#1C1917',
  dark2:  '#27231F',
  dark3:  '#322E29',
  dark4:  '#3D3732',
}

// ─────────────────────────────────────────
// TEMAS
// ─────────────────────────────────────────

export const lightTheme = {
  colors: {
    primary:        palette.violet600,
    primaryLight:   palette.violet100,
    primaryDark:    palette.violet800,
    secondary:      palette.emerald500,
    secondaryLight: palette.emerald400,

    // Warm cream background — más personal que el blanco puro
    background:    palette.warmGray50,
    surface:       palette.warmGray100,
    card:          palette.white,
    border:        palette.warmGray200,
    divider:       palette.warmGray100,

    text:          palette.warmGray900,
    textSecondary: palette.warmGray500,
    textDisabled:  palette.warmGray300,
    textInverse:   palette.white,

    success:       palette.emerald500,
    warning:       palette.amber500,
    error:         palette.red500,
    info:          palette.violet600,

    // Celebration — días perfectos, logros grandes
    celebration:   palette.pink500,
    celebrationLight: palette.pink300,

    xpBar:         palette.amber400,
    streak:        palette.orange500,

    heatmap: {
      empty:  palette.warmGray200,
      low:    palette.violet100,
      medium: palette.violet400,
      high:   palette.violet600,
    },

    scoreRing: {
      low:    palette.red400,
      mid:    palette.amber400,
      high:   palette.emerald400,
      track:  palette.warmGray200,
    },

    tabBar:        palette.white,
    tabBarBorder:  palette.warmGray200,
    tabActive:     palette.violet600,
    tabInactive:   palette.warmGray400,

    overlay:       'rgba(28,25,23,0.4)',
    backdrop:      'rgba(28,25,23,0.5)',
  },
  isDark: false,
}

export const darkTheme = {
  colors: {
    primary:        palette.violet400,
    primaryLight:   palette.violet800,
    primaryDark:    palette.violet300,
    secondary:      palette.emerald400,
    secondaryLight: palette.emerald400,

    background:    palette.dark0,
    surface:       palette.dark1,
    card:          palette.dark2,
    border:        palette.dark3,
    divider:       palette.dark2,

    text:          '#F5F0EB',
    textSecondary: '#A39E99',
    textDisabled:  palette.dark4,
    textInverse:   palette.dark0,

    success:       palette.emerald400,
    warning:       palette.amber400,
    error:         palette.red400,
    info:          palette.violet400,

    celebration:   palette.pink400,
    celebrationLight: '#7A2040',

    xpBar:         palette.amber400,
    streak:        palette.orange400,

    heatmap: {
      empty:  palette.dark3,
      low:    palette.violet800,
      medium: palette.violet500,
      high:   palette.violet300,
    },

    scoreRing: {
      low:    palette.red400,
      mid:    palette.amber400,
      high:   palette.emerald400,
      track:  palette.dark3,
    },

    tabBar:        palette.dark1,
    tabBarBorder:  palette.dark2,
    tabActive:     palette.violet400,
    tabInactive:   palette.warmGray500,

    overlay:       'rgba(0,0,0,0.6)',
    backdrop:      'rgba(0,0,0,0.75)',
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
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 6,
  },
}

// ─────────────────────────────────────────
// COLORES DE HÁBITOS (opciones para el usuario)
// ─────────────────────────────────────────

export const HABIT_COLORS = [
  '#7C3AED', // Violet
  '#6D28D9', // Violet dark
  '#8B5CF6', // Violet light
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#64748B', // Slate
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

// ─────────────────────────────────────────
// AVATARES — emojis para el perfil del usuario
// ─────────────────────────────────────────

export const AVATAR_EMOJIS = [
  '🦁', '🐯', '🐻', '🦊', '🐺',
  '🦅', '🦋', '🌊', '🔥', '⚡',
  '🌟', '💎', '🚀', '🌿', '🎯',
  '🏔️', '🌙', '☀️', '🦄', '🐉',
  '👾', '🎮', '🌺', '🍀',
]

// ─────────────────────────────────────────
// ACCENT COLORS — para personalización del usuario
// ─────────────────────────────────────────

export const ACCENT_COLORS = [
  { name: 'Violet',   light: '#7C3AED', dark: '#A78BFA' },
  { name: 'Azul',     light: '#2563EB', dark: '#60A5FA' },
  { name: 'Verde',    light: '#059669', dark: '#34D399' },
  { name: 'Rosa',     light: '#DB2777', dark: '#F472B6' },
  { name: 'Naranja',  light: '#EA580C', dark: '#FB923C' },
  { name: 'Teal',     light: '#0891B2', dark: '#22D3EE' },
  { name: 'Índigo',   light: '#4F46E5', dark: '#818CF8' },
  { name: 'Rojo',     light: '#DC2626', dark: '#F87171' },
]
