import { Stack, Redirect } from 'expo-router'
import { useUserStore } from '@/stores/user.store'

export default function AuthLayout() {
  const { user } = useUserStore()

  // Si ya está autenticado y completó onboarding, ir al main
  if (user?.onboarding_complete) return <Redirect href="/(main)/today" />
  // Si está autenticado pero no hizo onboarding, ir al onboarding
  if (user) return <Redirect href="/onboarding" />

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
