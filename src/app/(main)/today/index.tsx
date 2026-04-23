import React, { useEffect, useCallback, useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { useUserStore } from '@/stores/user.store'
import { useSyncStore } from '@/stores/sync.store'
import { HabitCard } from '@/components/habits/HabitCard'
import { HabitDetailSheet } from '@/components/habits/HabitDetailSheet'
import { ValueInputModal } from '@/components/habits/ValueInputModal'
import { ScoreRing } from '@/components/stats/ScoreRing'
import { XPProgressBar } from '@/components/gamification/XPProgressBar'
import { Card } from '@/components/ui/Card'
import { MotivationCard } from '@/components/ui/MotivationCard'
import { MoodPicker } from '@/components/ui/MoodPicker'
import { JournalCard } from '@/components/ui/JournalCard'
import { JournalSheet } from '@/components/ui/JournalSheet'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { formatDisplayDate, todayString } from '@/utils/date'
import { HabitWithCompletion } from '@/types'

// ── Barra de progreso del día animada ──────────────────────────────
function DayProgressBar({ rate, allDone }: { rate: number; allDone: boolean }) {
  const { colors } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(rate, { duration: 400, easing: Easing.out(Easing.cubic) })
  }, [rate])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }))

  return (
    <View style={[progressStyles.track, { backgroundColor: colors.surface }]}>
      <Animated.View
        style={[
          progressStyles.fill,
          { backgroundColor: allDone ? colors.success : colors.primary },
          animatedStyle,
        ]}
      />
    </View>
  )
}

const progressStyles = StyleSheet.create({
  track: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: radius.full },
})

export default function TodayScreen() {
  const { colors } = useTheme()
  const { user, level, levelProgress, xpToNextLevel } = useUserStore()
  const { habits, loadHabits, isLoading: habitsLoading } = useHabitsStore()
  const {
    loadTodayCompletions, loadRecentCompletions,
    toggleCompletion, habitsWithCompletions,
    completedTodayCount, todayCompletionRate,
    recentCompletions, todayCompletions,
  } = useCompletionsStore()
  const { isOnline } = useSyncStore()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<HabitWithCompletion | null>(null)
  const [valueInputHabit, setValueInputHabit] = useState<HabitWithCompletion | null>(null)
  const [journalOpen, setJournalOpen] = useState(false)

  const loadData = useCallback(async () => {
    await Promise.all([loadHabits(), loadTodayCompletions(), loadRecentCompletions()])
  }, [loadHabits, loadTodayCompletions, loadRecentCompletions])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleToggle = (habitId: string, value?: number) => {
    toggleCompletion(habitId, isOnline, value)
  }

  const handleHabitPress = (habit: HabitWithCompletion) => {
    setSelectedHabit(habit)
  }

  const handleRequestValue = (habit: HabitWithCompletion) => {
    setValueInputHabit(habit)
  }

  const handleValueConfirm = (habitId: string, value: number) => {
    toggleCompletion(habitId, isOnline, value)
    setValueInputHabit(null)
  }

  const handleValueSkip = (habitId: string) => {
    toggleCompletion(habitId, isOnline)
    setValueInputHabit(null)
  }

  const habitsData = habitsWithCompletions()
  const completedCount = completedTodayCount()
  const completionRate = todayCompletionRate()
  const allDone = habits.length > 0 && completedCount === habits.length

  // Detectar hábitos en riesgo de abandono (0 completions en los últimos 7 días)
  const atRiskHabitIds = useMemo(() => {
    const last7Set = new Set<string>()
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      last7Set.add(d.toISOString().split('T')[0])
    }
    const completedLast7 = new Set(
      recentCompletions
        .filter((c) => last7Set.has(c.completed_date))
        .map((c) => c.habit_id)
    )
    return new Set(habits.filter((h) => !completedLast7.has(h.id)).map((h) => h.id))
  }, [recentCompletions, habits])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Mayor racha activa entre todos los hábitos
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.current_streak ?? 0), 0)

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

            {/* Barra de progreso del día animada */}
            <DayProgressBar rate={completionRate} allDone={allDone} />

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

      {/* ── Tarjeta de motivación dinámica ── */}
      <MotivationCard
        completedCount={completedCount}
        totalHabits={habits.length}
        currentStreak={maxStreak}
        globalScore={user?.global_score ?? 0}
        displayName={user?.display_name}
      />

      {/* Mood del día */}
      <MoodPicker />

      {/* Journal diario */}
      <JournalCard onPress={() => setJournalOpen(true)} />

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
            onPress={handleHabitPress}
            onRequestValue={handleRequestValue}
            atRisk={atRiskHabitIds.has(item.id)}
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

      {/* Detalle del hábito — bottom sheet al hacer tap */}
      <HabitDetailSheet
        habit={selectedHabit}
        recentCompletions={[...recentCompletions, ...todayCompletions]}
        onClose={() => setSelectedHabit(null)}
        onToggle={(habitId) => toggleCompletion(habitId, isOnline)}
      />

      {/* Input de valor para hábitos medibles/tiempo */}
      <ValueInputModal
        habit={valueInputHabit}
        onConfirm={handleValueConfirm}
        onSkip={handleValueSkip}
        onClose={() => setValueInputHabit(null)}
      />

      {/* Journal sheet */}
      <JournalSheet
        visible={journalOpen}
        onClose={() => setJournalOpen(false)}
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
