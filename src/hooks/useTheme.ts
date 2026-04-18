import { useColorScheme } from 'react-native'
import { getTheme, AppTheme } from '@/constants/theme'

export function useTheme(): AppTheme & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme()
  const theme = getTheme(scheme)
  return { ...theme, scheme: theme.isDark ? 'dark' : 'light' }
}
