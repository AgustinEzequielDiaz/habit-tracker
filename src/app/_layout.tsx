import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useSync } from '@/hooks/useSync'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const scheme = useColorScheme()
  const { setUser } = useUserStore()
  const { hydrate } = useSettingsStore()
  useSync()

  // Cargar preferencias del usuario al arrancar la app
  useEffect(() => { hydrate() }, [])

  useEffect(() => {
    // Fallback: ocultar splash a los 5s si el listener de auth no responde
    // (lo ponemos dentro del useEffect para evitar re-timers en hot reload)
    const splashFallback = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {})
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (data) setUser(data as any)
        } else {
          setUser(null)
        }
      } catch (e) {
        console.warn('Auth state change error:', e)
        setUser(null)
      } finally {
        clearTimeout(splashFallback)
        SplashScreen.hideAsync().catch(() => {})
      }
    })

    return () => {
      clearTimeout(splashFallback)
      subscription.unsubscribe()
    }
  }, [setUser])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(main)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
