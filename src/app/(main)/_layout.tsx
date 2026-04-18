import { Tabs, Redirect } from 'expo-router'
import { useColorScheme, Text } from 'react-native'
import { useUserStore } from '@/stores/user.store'
import { getTheme } from '@/constants/theme'

export default function MainLayout() {
  const { user } = useUserStore()
  const scheme = useColorScheme()
  const { colors } = getTheme(scheme)

  if (!user) return <Redirect href="/(auth)" />
  if (!user.onboarding_complete) return <Redirect href="/onboarding" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="today/index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✅</Text>,
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  )
}
