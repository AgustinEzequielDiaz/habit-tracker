import { Tabs, Redirect, router } from 'expo-router'
import { useColorScheme, Text, View } from 'react-native'
import { useState } from 'react'
import { useUserStore } from '@/stores/user.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { useSyncStore } from '@/stores/sync.store'
import { useSettingsStore } from '@/stores/settings.store'
import { getTheme } from '@/constants/theme'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { QuickCompleteSheet } from '@/components/habits/QuickCompleteSheet'
import { JournalSheet } from '@/components/ui/JournalSheet'

export default function MainLayout() {
  const { user } = useUserStore()
  const scheme = useColorScheme()
  const { colors } = getTheme(scheme)
  const { fabAction } = useSettingsStore()
  const { isOnline } = useSyncStore()
  const { habits } = useHabitsStore()
  const { habitsWithCompletions, toggleCompletion } = useCompletionsStore()

  const [quickSheetOpen, setQuickSheetOpen] = useState(false)
  const [journalSheetOpen, setJournalSheetOpen] = useState(false)

  if (!user) return <Redirect href="/(auth)" />
  if (!user.onboarding_complete) return <Redirect href="/onboarding" />

  const handleFabPress = () => {
    switch (fabAction) {
      case 'quick_complete':
        setQuickSheetOpen(true)
        break
      case 'new_habit':
        router.navigate('/(main)/habits/index')
        break
      case 'log_mood':
        // Navigate to today tab — MoodPicker is already there
        router.navigate('/(main)/today/index')
        break
      case 'write_note':
        setJournalSheetOpen(true)
        break
    }
  }

  const habitsData = habitsWithCompletions()

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 0.5,
            paddingBottom: 6,
            paddingTop: 6,
            height: 64,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
            letterSpacing: 0.3,
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
          name="agenda/index"
          options={{
            title: 'Agenda',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
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
        {/* Settings — accesible via router.push, oculto del tab bar */}
        <Tabs.Screen
          name="settings/index"
          options={{ href: null }}
        />
      </Tabs>

      {/* FAB — flota sobre todo el tab bar */}
      <FloatingActionButton onPress={handleFabPress} />

      {/* Quick Complete Sheet */}
      <QuickCompleteSheet
        visible={quickSheetOpen}
        habits={habitsData}
        onToggle={(habitId) => toggleCompletion(habitId, isOnline)}
        onClose={() => setQuickSheetOpen(false)}
      />

      {/* Journal Sheet (desde FAB cuando fabAction = write_note) */}
      <JournalSheet
        visible={journalSheetOpen}
        onClose={() => setJournalSheetOpen(false)}
      />
    </View>
  )
}
