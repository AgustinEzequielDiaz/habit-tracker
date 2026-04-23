import { Habit, HabitCompletion, FrequencyType } from '@/types'
import { todayString } from './date'

// ─────────────────────────────────────────
// Etiquetas legibles para frecuencia
// ─────────────────────────────────────────

const WEEKDAY_ABBR = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] // 0=Dom

export function getFrequencyLabel(habit: Habit): string | null {
  const type = habit.frequency_type ?? 'daily'
  if (type === 'daily') return null  // no badge — es el default
  if (type === 'weekly') {
    const n = habit.frequency_days ?? 1
    return `${n}×/sem`
  }
  if (type === 'custom') {
    const days = (habit.frequency_weekdays ?? []).sort((a, b) => {
      // Sort Mon→Sun: shift Sunday to end
      const normA = a === 0 ? 7 : a
      const normB = b === 0 ? 7 : b
      return normA - normB
    })
    if (days.length === 0) return null
    if (days.length <= 3) return days.map((d) => WEEKDAY_ABBR[d]).join(', ')
    return `${days.length}d/sem`
  }
  return null
}

// ─────────────────────────────────────────
// ¿El hábito debe mostrarse hoy?
// Solo filtra hábitos de tipo 'custom' — los 'weekly' siempre se muestran.
// ─────────────────────────────────────────

export function isHabitDueToday(habit: Habit): boolean {
  const type = habit.frequency_type ?? 'daily'
  if (type === 'daily' || type === 'weekly') return true
  if (type === 'custom') {
    const weekdays = habit.frequency_weekdays ?? []
    if (weekdays.length === 0) return true  // misconfigured → show always
    const todayWeekday = new Date().getDay()  // 0=Dom
    return weekdays.includes(todayWeekday)
  }
  return true
}

// ─────────────────────────────────────────
// Lunes de la semana actual (YYYY-MM-DD)
// ─────────────────────────────────────────

export function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()           // 0=Dom, 1=Lun … 6=Sab
  const diffToMon = day === 0 ? -6 : 1 - day  // días hasta el lunes
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  return monday.toISOString().split('T')[0]
}

// ─────────────────────────────────────────
// Cuántas veces se completó un hábito en la semana actual
// ─────────────────────────────────────────

export function getWeeklyCompletionCount(
  habitId: string,
  completions: HabitCompletion[]
): number {
  const weekStart = getWeekStart()
  const today = todayString()
  return completions.filter(
    (c) =>
      c.habit_id === habitId &&
      c.completed_date >= weekStart &&
      c.completed_date <= today
  ).length
}

// ─────────────────────────────────────────
// ¿El hábito semanal está satisfecho esta semana?
// ─────────────────────────────────────────

export function isWeeklyHabitSatisfied(
  habit: Habit,
  completions: HabitCompletion[]
): boolean {
  const target = habit.frequency_days ?? 1
  return getWeeklyCompletionCount(habit.id, completions) >= target
}
