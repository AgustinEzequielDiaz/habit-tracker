import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/services/supabase'
import { HeatmapGrid } from '@/components/stats/HeatmapGrid'
import { ScoreRing } from '@/components/stats/ScoreRing'
import { WeeklyChart } from '@/components/stats/WeeklyChart'
import { InsightsCard } from '@/components/stats/InsightsCard'
import { Card } from '@/components/ui/Card'
import { useUserStore } from '@/stores/user.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography } from '@/constants/theme'
import { DailySummary, HabitCompletion } from '@/types'
import { getLast30Days, formatShortDate } from '@/utils/date'

export default function StatsScreen() {
  const { colors } = useTheme()
  const { user } = useUserStore()
  const { habits, loadHabits } = useHabitsStore()
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    await loadHabits()

    const thirtyDaysAgo = getLast30Days()[0]

    const [summaryRes, completionRes] = await Promise.all([
      supabase
        .from('daily_summaries')
        .select('*')
        .order('summary_date', { ascending: false })
        .limit(365),
      supabase
        .from('habit_completions')
        .select('habit_id, completed_date')
        .gte('completed_date', thirtyDaysAgo),
    ])

    setSummaries((summaryRes.data ?? []) as DailySummary[])
    setCompletions((completionRes.data ?? []) as HabitCompletion[])
    setLoading(false)
  }, [loadHabits])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Stats globales de los últimos 30 días
  const last30 = getLast30Days()
  const summaryMap = new Map(summaries.map((s) => [s.summary_date, s]))
  const daysWithData = last30.map((d) => summaryMap.get(d)).filter(Boolean) as DailySummary[]

  const avgCompletion = daysWithData.length > 0
    ? daysWithData.reduce((sum, s) => sum + s.completion_rate, 0) / daysWithData.length
    : 0
  const perfectDays = daysWithData.filter((s) => s.completion_rate >= 100).length
  const totalXpLast30 = daysWithData.reduce((sum, s) => sum + s.xp_earned, 0)
  const bestStreak = user?.streak_best ?? 0

  // Mapa de completions por hábito para la sección "Por hábito"
  const completionsByHabit = new Map<string, Set<string>>()
  for (const c of completions) {
    if (!completionsByHabit.has(c.habit_id)) {
      completionsByHabit.set(c.habit_id, new Set())
    }
    completionsByHabit.get(c.habit_id)!.add(c.completed_date)
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>

        {/* Score global */}
        <Card>
          <View style={styles.scoreRow}>
            <ScoreRing score={user?.global_score ?? 0} size={100} />
            <View style={styles.scoreStats}>
              {[
                { label: 'Promedio 30d', value: `${Math.round(avgCompletion)}%` },
                { label: 'Días perfectos', value: String(perfectDays) },
                { label: 'XP este mes', value: `+${totalXpLast30}` },
                { label: 'Mejor racha', value: `${bestStreak}d 🔥` },
              ].map((stat) => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── NUEVO: Gráfico semanal ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimos 7 días</Text>
          <Card>
            <WeeklyChart summaries={summaries} />
          </Card>
        </View>

        {/* ── NUEVO: Insights ── */}
        {(summaries.length > 3 || completions.length > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
            <InsightsCard
              summaries={summaries}
              completions={completions}
              habits={habits}
            />
          </View>
        )}

        {/* Heatmap */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad del año</Text>
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HeatmapGrid
                summaries={summaries}
                onDayPress={(summary) => setSelectedDay(summary)}
              />
            </ScrollView>
          </Card>
        </View>

        {/* Detalle del día seleccionado */}
        {selectedDay && (
          <Card style={[styles.selectedDay, { borderColor: `${colors.primary}50` }]}>
            <Text style={[styles.selectedDayDate, { color: colors.textSecondary }]}>
              {formatShortDate(selectedDay.summary_date)}
            </Text>
            <View style={styles.selectedDayStats}>
              <Text style={[styles.selectedDayStat, { color: colors.text }]}>
                {selectedDay.habits_completed}/{selectedDay.habits_total} hábitos
              </Text>
              <Text style={[styles.selectedDayStat, { color: colors.primary }]}>
                +{selectedDay.xp_earned} XP
              </Text>
              <Text style={[styles.selectedDayStat, { color: colors.text }]}>
                Score: {Math.round(selectedDay.global_score)}
              </Text>
            </View>
          </Card>
        )}

        {/* Por hábito — últimos 30 días */}
        {habits.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Por hábito (30 días)</Text>
            {habits
              .slice()
              .sort((a, b) => {
                const aSet = completionsByHabit.get(a.id) ?? new Set<string>()
                const bSet = completionsByHabit.get(b.id) ?? new Set<string>()
                const aRate = last30.filter((d) => aSet.has(d)).length
                const bRate = last30.filter((d) => bSet.has(d)).length
                return bRate - aRate
              })
              .map((habit) => {
              const doneSet = completionsByHabit.get(habit.id) ?? new Set<string>()
              const doneCount = last30.filter((d) => doneSet.has(d)).length
              const rate = last30.length > 0 ? (doneCount / last30.length) * 100 : 0
              const streak = habit.current_streak ?? 0

              return (
                <Card key={habit.id} style={styles.habitStatCard} padding={spacing.md}>
                  <View style={styles.habitStatRow}>
                    <View style={[styles.habitColorBar, { backgroundColor: habit.color }]} />
                    <View style={styles.habitStatBody}>
                      <View style={styles.habitStatTopRow}>
                        <Text style={[styles.habitStatName, { color: colors.text }]} numberOfLines={1}>
                          {habit.name}
                        </Text>
                        <View style={styles.habitStatMeta}>
                          {streak >= 2 && (
                            <Text style={[styles.habitStreak, { color: colors.streak }]}>
                              🔥 {streak}
                            </Text>
                          )}
                          <Text style={[styles.habitStatPercent, { color: rate >= 70 ? colors.success : rate >= 40 ? colors.warning : colors.textSecondary }]}>
                            {Math.round(rate)}%
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.habitStatBar, { backgroundColor: colors.surface }]}>
                        <View
                          style={[
                            styles.habitStatFill,
                            { backgroundColor: habit.color, width: `${Math.min(rate, 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  scoreStats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    width: '45%',
    gap: 2,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  selectedDay: { borderWidth: 1 },
  selectedDayDate: { fontSize: typography.sizes.sm, fontWeight: '600' },
  selectedDayStats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs, flexWrap: 'wrap' },
  selectedDayStat: { fontSize: typography.sizes.sm, fontWeight: '600' },
  habitStatCard: { marginBottom: 0 },
  habitStatRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  habitColorBar: { width: 3, borderRadius: 2, minHeight: 40 },
  habitStatBody: { flex: 1, gap: 6 },
  habitStatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habitStatName: { flex: 1, fontSize: typography.sizes.sm, fontWeight: '600' },
  habitStatMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  habitStreak: { fontSize: typography.sizes.xs, fontWeight: '700' },
  habitStatBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  habitStatFill: { height: '100%', borderRadius: 3 },
  habitStatPercent: { fontSize: typography.sizes.xs, fontWeight: '700', minWidth: 30, textAlign: 'right' },
})
