import { useColorScheme } from 'react-native'
import { getTheme, AppTheme } from '@/constants/theme'
import { useSettingsStore } from '@/stores/settings.store'

/**
 * useTheme — devuelve el tema activo con el color de acento personalizado del usuario.
 * Si el usuario eligió un color en Settings, ese color reemplaza al primary del tema base.
 */
export function useTheme(): AppTheme & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme()
  const baseTheme = getTheme(scheme)
  const { accentColor } = useSettingsStore()

  if (!accentColor) {
    return { ...baseTheme, scheme: baseTheme.isDark ? 'dark' : 'light' }
  }

  // Inyectar el color de acento personalizado
  const customPrimary = baseTheme.isDark ? accentColor.dark : accentColor.light
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary:     customPrimary,
      primaryDark: baseTheme.isDark ? accentColor.light : accentColor.dark,
      info:        customPrimary,
      tabActive:   customPrimary,
      heatmap: {
        ...baseTheme.colors.heatmap,
        medium: customPrimary + 'AA',
        high:   customPrimary,
      },
    },
    scheme: baseTheme.isDark ? 'dark' : 'light',
  }
}
