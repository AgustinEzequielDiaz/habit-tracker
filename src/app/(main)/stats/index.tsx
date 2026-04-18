import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/services/supabase'
import { HeatmapGrid } from '@/components/stats/HeatmapGrid'
import { ScoreRing } from '@/components/stats/ScoreRing'
import { Card } from '@/components/ui/Card'
import { useUserStore } from '@/stores/user.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography } from '@/constants/theme'
import { DailySummary } from '@/types'
import { getLast30Days, formatShortDate } from '@/utils/date'

export default function StatsScreen() {
  const { colors } = useTheme()
  const { user } = useUserStore()
  const { habits } = useHabitsStore()
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(null)

  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('daily_summaries')
      .select('*')
      .order('summary_date', { ascending: false })
      .limit(365)
    setSummaries((data ?? []) as DailySummary[])
    setLoading(false)
  }

  // Stats de los últimos 30 días
  const last30 = getLast30Days()
  const summaryMap = new Map(summaries.map((s) => [s.summary_date, s]))

  const last30Summaries = last30.map((d) => summaryMap.get(d))
  const daysWithData = last30Summaries.filter(Boolean) as DailySummary[]
  const avgCompletion = daysWithData.length > 0
    ? daysWithData.reduce((sum, s) => sum + s.completion_rate, 0) / daysWithData.length
    : 0
  const perfectDays = daysWithData.filter((s) => s.completion_rate >= 100).length
  const totalXpLast30 = daysWithData.reduce((sum, s) => sum + s.xp_earned, 0)

  const bestStreak = user?.streak_best ?? 0

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
        {/* Header */}
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

        {/* Heatmap */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad del año</Text>
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HeatmapGrid
                summaries={summaries}
                onDayPress={(summary, date) => setSelectedDay(summary)}
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

        {/* Por hábito */}
        {habits.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Por hábito (30 días)</Text>
            {habits.map((habit) => {
              const habitCompletions = summaries.filter((s) =>
                last30.includes(s.summary_date)
              ).length
              const rate = last30.length > 0 ? (habitCompletions / last30.length) * 100 : 0

              return (
                <Card key={habit.id} style={styles.habitStatCard} padding={spacing.md}>
                  <View style={styles.habitStatRow}>
                    <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                    <Text style={[styles.habitStatName, { color: colors.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={styles.habitStatRight}>
                      <View style={[styles.habitStatBar, { backgroundColor: colors.surface }]}>
                        <View
                          style={[
                            styles.habitStatFill,
                            { backgroundColor: habit.color, width: `${Math.min(rate, 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.habitStatPercent, { color: colors.textSecondary }]}>
                        {Math.round(rate)}%
                      </Text>
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
  selectedDay: {
    borderWidth: 1,
  },
  selectedDayDate: { fontSize: typography.sizes.sm, fontWeight: '600' },
  selectedDayStats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  selectedDayStat: { fontSize: typography.sizes.sm, fontWeight: '600' },
  habitStatCard: { marginBottom: 0 },
  habitStatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  habitDot: { width: 10, height: 10, borderRadius: 5 },
  habitStatName: { flex: 1, fontSize: typography.sizes.sm, fontWeight: '500' },
  habitStatRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: 120 },
  habitStatBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  habitStatFill: { height: '100%', borderRadius: 3 },
  habitStatPercent: { fontSize: typography.sizes.xs, width: 30, textAlign: 'right' },
})
