import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user.store'
import { useSync } from '@/hooks/useSync'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const scheme = useColorScheme()
  const { setUser } = useUserStore()
  useSync()  // Inicializa el listener de red globalmente

  useEffect(() => {
    // Listener de sesión de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Usuario autenticado: cargar perfil
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setUser(data)
      } else {
        setUser(null)
      }
      SplashScreen.hideAsync()
    })

    return () => subscription.unsubscribe()
  }, [])

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
