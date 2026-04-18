import { HabitDifficulty, HabitScore, Habit, HabitCompletion } from '@/types'
import { getLast30Days, todayString } from './date'

// ─────────────────────────────────────────
// Constantes del algoritmo
// ─────────────────────────────────────────

export const DIFFICULTY_WEIGHT: Record<HabitDifficulty, number> = {
  easy:   0.8,
  normal: 1.0,
  hard:   1.3,
}

export function xpForCompletionRate(rate: number): number {
  if (rate >= 1.0) return 100
  if (rate >= 0.8) return 60
  if (rate >= 0.5) return 30
  return 10
}

// ─────────────────────────────────────────
// Score de un hábito individual
// ─────────────────────────────────────────

export function calcHabitScore(
  completedDates: Set<string>,
  difficulty: HabitDifficulty
): number {
  const last30 = getLast30Days()
  const expected = last30.length   // siempre 30

  const completionsInRange = last30.filter((d) => completedDates.has(d)).length

  // Calcular gap máximo consecutivo en los últimos 30 días
  let maxGap = 0
  let currentGap = 0
  for (const day of last30) {
    if (!completedDates.has(day)) {
      currentGap++
      maxGap = Math.max(maxGap, currentGap)
    } else {
      currentGap = 0
    }
  }

  const completionRate = completionsInRange / expected
  const gapPenalty = Math.max(0, (maxGap - 3) * 0.05)
  const regularityFactor = Math.max(0.5, 1 - gapPenalty)
  const diffWeight = DIFFICULTY_WEIGHT[difficulty]

  return Math.min(100, Math.round(completionRate * regularityFactor * diffWeight * 100 * 100) / 100)
}

// ─────────────────────────────────────────
// Score global del usuario
// ─────────────────────────────────────────

export function calcGlobalScore(habitScores: HabitScore[]): number {
  if (habitScores.length === 0) return 0

  // Promedio ponderado por dificultad
  const totalWeight = habitScores.reduce((sum, hs) => sum + hs.completionRate, 0)
  if (totalWeight === 0) return 0

  const weightedSum = habitScores.reduce((sum, hs) => sum + hs.score * hs.completionRate, 0)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

// ─────────────────────────────────────────
// Calcular scores para todos los hábitos del usuario
// ─────────────────────────────────────────

export function calcAllHabitScores(
  habits: Habit[],
  completions: HabitCompletion[]
): HabitScore[] {
  const completionsByHabit = new Map<string, Set<string>>()

  for (const c of completions) {
    if (!completionsByHabit.has(c.habit_id)) {
      completionsByHabit.set(c.habit_id, new Set())
    }
    completionsByHabit.get(c.habit_id)!.add(c.completed_date)
  }

  return habits.map((habit) => {
    const doneSet = completionsByHabit.get(habit.id) ?? new Set<string>()
    const score = calcHabitScore(doneSet, habit.difficulty)
    const last30 = getLast30Days()
    const completionsInRange = last30.filter((d) => doneSet.has(d)).length
    const completionRate = completionsInRange / 30

    // Calcular racha actual
    let currentStreak = 0
    const today = todayString()
    let checkDate = today
    while (doneSet.has(checkDate)) {
      currentStreak++
      const prev = new Date(checkDate)
      prev.setDate(prev.getDate() - 1)
      checkDate = prev.toISOString().split('T')[0]
    }

    return {
      habitId: habit.id,
      score,
      completionRate,
      currentStreak,
    }
  })
}

// ─────────────────────────────────────────
// Color del score (para UI)
// ─────────────────────────────────────────

export type ScoreLevel = 'low' | 'mid' | 'high'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

// ─────────────────────────────────────────
// Intensidad del heatmap (0–4)
// ─────────────────────────────────────────

export function heatmapIntensity(completionRate: number): 0 | 1 | 2 | 3 {
  if (completionRate === 0) return 0
  if (completionRate < 0.5) return 1
  if (completionRate < 0.8) return 2
  return 3
}
