import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { DailySummary, HabitCompletion, Habit } from '@/types'
import { getLast30Days, getLast7Days } from '@/utils/date'
import { parseISO, getDay } from 'date-fns'

interface InsightsCardProps {
  summaries: DailySummary[]
  completions: HabitCompletion[]
  habits: Habit[]
}

interface Insight {
  icon: string
  title: string
  detail: string
  type: 'positive' | 'warning' | 'neutral'
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function computeInsights(
  summaries: DailySummary[],
  completions: HabitCompletion[],
  habits: Habit[],
): Insight[] {
  const insights: Insight[] = []
  const last30 = getLast30Days()
  const last7 = getLast7Days()
  const summaryMap = new Map(summaries.map((s) => [s.summary_date, s]))

  // ── 1. Mejor día de la semana ────────────────────────────────
  const rateByDow: Record<number, { total: number; count: number }> = {}
  for (const dateStr of last30) {
    const s = summaryMap.get(dateStr)
    if (!s) continue
    const dow = getDay(parseISO(dateStr))
    if (!rateByDow[dow]) rateByDow[dow] = { total: 0, count: 0 }
    rateByDow[dow].total += s.completion_rate
    rateByDow[dow].count += 1
  }
  let bestDow = -1
  let bestAvg = -1
  let worstDow = -1
  let worstAvg = 101
  Object.entries(rateByDow).forEach(([dow, { total, count }]) => {
    const avg = total / count
    if (avg > bestAvg) { bestAvg = avg; bestDow = Number(dow) }
    if (avg < worstAvg) { worstAvg = avg; worstDow = Number(dow) }
  })
  if (bestDow !== -1) {
    insights.push({
      icon: '📅',
      title: `Mejor día: ${DAY_NAMES[bestDow]}`,
      detail: `Promedio de ${Math.round(bestAvg)}% en los últimos 30 días`,
      type: 'positive',
    })
  }
  if (worstDow !== -1 && worstDow !== bestDow && worstAvg < 60) {
    insights.push({
      icon: '⚠️',
      title: `Día difícil: ${DAY_NAMES[worstDow]}`,
      detail: `Solo ${Math.round(worstAvg)}% de cumplimiento. Considerá ajustar hábitos ese día`,
      type: 'warning',
    })
  }

  // ── 2. Tendencia semanal ─────────────────────────────────────
  const prev7 = last30.slice(0, 7)
  const curr7 = last7
  const avgPrev = prev7.reduce((s, d) => s + (summaryMap.get(d)?.completion_rate ?? 0), 0) / 7
  const avgCurr = curr7.reduce((s, d) => s + (summaryMap.get(d)?.completion_rate ?? 0), 0) / 7
  const diff = avgCurr - avgPrev
  if (Math.abs(diff) >= 5) {
    insights.push({
      icon: diff > 0 ? '📈' : '📉',
      title: diff > 0 ? 'Vas en alza' : 'Semana más floja',
      detail: diff > 0
        ? `+${Math.round(diff)}% vs la semana anterior. ¡Seguí así!`
        : `${Math.round(diff)}% vs la semana anterior. No te rindas`,
      type: diff > 0 ? 'positive' : 'warning',
    })
  }

  // ── 3. Hábito más consistente ────────────────────────────────
  if (habits.length > 0) {
    const countByHabit: Record<string, number> = {}
    for (const c of completions) {
      countByHabit[c.habit_id] = (countByHabit[c.habit_id] ?? 0) + 1
    }
    let topHabit: Habit | null = null
    let topCount = 0
    for (const h of habits) {
      const count = countByHabit[h.id] ?? 0
      if (count > topCount) { topCount = count; topHabit = h }
    }
    if (topHabit && topCount > 5) {
      const rate = Math.round((topCount / last30.length) * 100)
      insights.push({
        icon: '🏆',
        title: `Tu hábito estrella: ${topHabit.name}`,
        detail: `${rate}% de días en los últimos 30 días`,
        type: 'positive',
      })
    }
  }

  // ── 4. Racha perfecta actual ─────────────────────────────────
  const sortedDesc = [...last30].reverse()
  let streak = 0
  for (const d of sortedDesc) {
    const s = summaryMap.get(d)
    if (s && s.completion_rate >= 100) streak++
    else break
  }
  if (streak >= 2) {
    insights.push({
      icon: '🔥',
      title: `${streak} días perfectos seguidos`,
      detail: 'Completaste todos tus hábitos varios días consecutivos',
      type: 'positive',
    })
  }

  // ── 5. Hábito que más falla ──────────────────────────────────
  if (habits.length > 1) {
    const countByHabit: Record<string, number> = {}
    for (const c of completions) {
      countByHabit[c.habit_id] = (countByHabit[c.habit_id] ?? 0) + 1
    }
    let worstHabit: Habit | null = null
    let worstRate = 101
    for (const h of habits) {
      const count = countByHabit[h.id] ?? 0
      const rate = (count / last30.length) * 100
      if (rate < worstRate) { worstRate = rate; worstHabit = h }
    }
    if (worstHabit && worstRate < 40) {
      insights.push({
        icon: '💡',
        title: `${worstHabit.name} necesita atención`,
        detail: `Solo ${Math.round(worstRate)}% de cumplimiento. ¿Bajamos la dificultad?`,
        type: 'warning',
      })
    }
  }

  return insights.slice(0, 4) // máximo 4 insights
}

export function InsightsCard({ summaries, completions, habits }: InsightsCardProps) {
  const { colors } = useTheme()
  const insights = computeInsights(summaries, completions, habits)

  if (insights.length === 0) return null

  const typeColors = {
    positive: { bg: `${colors.success}14`, border: `${colors.success}40`, text: colors.success },
    warning:  { bg: `${colors.warning}14`, border: `${colors.warning}40`, text: colors.warning },
    neutral:  { bg: `${colors.primary}10`, border: `${colors.primary}30`, text: colors.primary },
  }

  return (
    <View style={styles.container}>
      {insights.map((insight, i) => {
        const tc = typeColors[insight.type]
        return (
          <View
            key={i}
            style={[styles.insightRow, { backgroundColor: tc.bg, borderColor: tc.border }]}
          >
            <Text style={styles.icon}>{insight.icon}</Text>
            <View style={styles.insightText}>
              <Text style={[styles.title, { color: colors.text }]}>{insight.title}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{insight.detail}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  detail: {
    fontSize: typography.sizes.xs,
    lineHeight: 17,
  },
})
