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

  // ── 6. Riesgo de abandono: 0 completions en los últimos 7 días ──
  if (habits.length > 0 && last7.length > 0) {
    const completionLast7 = completions.filter((c) => last7.includes(c.completed_date))
    const countByHabitLast7: Record<string, number> = {}
    for (const c of completionLast7) {
      countByHabitLast7[c.habit_id] = (countByHabitLast7[c.habit_id] ?? 0) + 1
    }
    // Hábitos con 0 completions en los últimos 7 días (y que tienen al menos 14 días de historia)
    const atRiskHabits = habits.filter((h) => {
      const last7Count = countByHabitLast7[h.id] ?? 0
      return last7Count === 0
    })
    if (atRiskHabits.length === 1) {
      insights.push({
        icon: '🚨',
        title: `Riesgo de abandono: ${atRiskHabits[0].name}`,
        detail: 'Sin completar en 7 días. Una pequeña acción hoy puede reactivar el hábito.',
        type: 'warning',
      })
    } else if (atRiskHabits.length > 1) {
      insights.push({
        icon: '🚨',
        title: `${atRiskHabits.length} hábitos sin actividad esta semana`,
        detail: `${atRiskHabits.map((h) => h.name).slice(0, 2).join(', ')}${atRiskHabits.length > 2 ? ` y ${atRiskHabits.length - 2} más` : ''}`,
        type: 'warning',
      })
    }
  }

  // ── 7. Correlación simple: tasa alta cuando el primer hábito se completa ──
  if (habits.length >= 2) {
    // Encontrar el hábito con más completions (ancla)
    const countByHabit: Record<string, number> = {}
    for (const c of completions) {
      countByHabit[c.habit_id] = (countByHabit[c.habit_id] ?? 0) + 1
    }
    const anchorHabit = habits.reduce((best, h) =>
      (countByHabit[h.id] ?? 0) > (countByHabit[best.id] ?? 0) ? h : best
    )
    const anchorCompletionDates = new Set(
      completions.filter((c) => c.habit_id === anchorHabit.id).map((c) => c.completed_date)
    )
    // Días donde se completó el hábito ancla
    const anchorDays = last30.filter((d) => anchorCompletionDates.has(d))
    if (anchorDays.length >= 5) {
      const totalCompletionsOnAnchorDays = completions.filter(
        (c) => anchorCompletionDates.has(c.completed_date) && c.habit_id !== anchorHabit.id
      ).length
      const avgOthersOnAnchorDays = totalCompletionsOnAnchorDays / anchorDays.length / Math.max(habits.length - 1, 1)
      if (avgOthersOnAnchorDays > 0.65) {
        insights.push({
          icon: '🔗',
          title: `${anchorHabit.name} impulsa tus demás hábitos`,
          detail: `Cuando completás este hábito, completás ${Math.round(avgOthersOnAnchorDays * 100)}% de tus otros hábitos`,
          type: 'positive',
        })
      }
    }
  }

  return insights.slice(0, 5) // máximo 5 insights en V3
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
