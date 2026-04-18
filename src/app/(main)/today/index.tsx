import React, { useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { useUserStore } from '@/stores/user.store'
import { useSyncStore } from '@/stores/sync.store'
import { HabitCard } from '@/components/habits/HabitCard'
import { ScoreRing } from '@/components/stats/ScoreRing'
import { XPProgressBar } from '@/components/gamification/XPProgressBar'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { formatDisplayDate, todayString } from '@/utils/date'
import { HabitWithCompletion } from '@/types'

export default function TodayScreen() {
  const { colors } = useTheme()
  const { user, level, levelProgress, xpToNextLevel } = useUserStore()
  const { habits, loadHabits, isLoading: habitsLoading } = useHabitsStore()
  const {
    loadTodayCompletions, loadRecentCompletions,
    toggleCompletion, habitsWithCompletions,
    completedTodayCount, todayCompletionRate,
  } = useCompletionsStore()
  const { isOnline } = useSyncStore()

  const [refreshing, setRefreshing] = React.useState(false)

  const loadData = useCallback(async () => {
    await Promise.all([loadHabits(), loadTodayCompletions(), loadRecentCompletions()])
  }, [])

  useEffect(() => { loadData() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleToggle = (habitId: string, value?: number) => {
    toggleCompletion(habitId, isOnline, value)
  }

  const habitsData = habitsWithCompletions()
  const completedCount = completedTodayCount()
  const completionRate = todayCompletionRate()
  const allDone = habits.length > 0 && completedCount === habits.length

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Sync indicator */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warning }]}>
          <Text style={styles.offlineBannerText}>Sin conexión — los cambios se guardan localmente</Text>
        </View>
      )}

      {/* Saludo */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting()}, {user?.display_name?.split(' ')[0] ?? 'ahí'} 👋
          </Text>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDisplayDate(todayString())}
          </Text>
        </View>
      </View>

      {/* Dashboard card */}
      <Card style={styles.dashboardCard}>
        <View style={styles.dashboardContent}>
          <ScoreRing score={user?.global_score ?? 0} size={110} />
          <View style={styles.dashboardRight}>
            {/* Progreso del día */}
            <View>
              <Text style={[styles.progressTitle, { color: colors.textSecondary }]}>
                Hoy
              </Text>
              <Text style={[styles.progressText, { color: colors.text }]}>
                {completedCount} / {habits.length}
                <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                  {' '}completados
                </Text>
              </Text>
            </View>

            {/* Barra de progreso del día */}
            <View style={[styles.dayProgressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.dayProgressFill,
                  {
                    backgroundColor: allDone ? colors.success : colors.primary,
                    width: `${completionRate * 100}%`,
                  },
                ]}
              />
            </View>

            {/* XP */}
            <XPProgressBar
              level={level}
              levelProgress={levelProgress}
              xpToNextLevel={xpToNextLevel}
              totalXp={user?.total_xp ?? 0}
              compact
            />
          </View>
        </View>

        {/* Mensaje cuando todos completados */}
        {allDone && (
          <View style={[styles.perfectDayBadge, { backgroundColor: `${colors.success}20` }]}>
            <Text style={[styles.perfectDayText, { color: colors.success }]}>
              ⭐ Día perfecto — ¡lo lograste!
            </Text>
          </View>
        )}
      </Card>

      {/* Título de la lista */}
      <Text style={[styles.listTitle, { color: colors.textSecondary }]}>
        {habits.length === 0
          ? 'Tus hábitos de hoy'
          : `${habits.length} hábito${habits.length > 1 ? 's' : ''} para hoy`}
      </Text>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>✨</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No tenés hábitos todavía
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Andá a la pestaña de Hábitos para agregar el primero
      </Text>
    </View>
  )

  if (habitsLoading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={habitsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onToggle={handleToggle}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 0,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  offlineBanner: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  dateText: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  dashboardCard: {
    gap: spacing.md,
  },
  dashboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  dashboardRight: {
    flex: 1,
    gap: spacing.md,
  },
  progressTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressText: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  progressSub: {
    fontSize: typography.sizes.md,
    fontWeight: '400',
  },
  dayProgressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  dayProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  perfectDayBadge: {
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  perfectDayText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
})
