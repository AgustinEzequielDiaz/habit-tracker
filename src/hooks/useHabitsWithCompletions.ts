import { useMemo } from 'react'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { HabitWithCompletion } from '@/types'
import { getWeeklyCompletionCount } from '@/utils/frequency'
import { todayString } from '@/utils/date'

/**
 * Hook memoizado que combina hábitos + completions de hoy.
 *
 * Por qué existe:
 *   habitsWithCompletions() en el completions store es una función que
 *   genera nuevos arrays en cada llamada, provocando re-renders
 *   innecesarios en componentes que la consumen.
 *   Este hook usa useMemo con dependencias precisas para que el array
 *   resultante solo se recalcule cuando cambia algo relevante.
 *
 * Uso:
 *   const habitsData = useHabitsWithCompletions()
 */
export function useHabitsWithCompletions(): HabitWithCompletion[] {
  const habits          = useHabitsStore((s) => s.habits)
  const todayCompletions  = useCompletionsStore((s) => s.todayCompletions)
  const recentCompletions = useCompletionsStore((s) => s.recentCompletions)

  return useMemo(() => {
    const today = todayString()
    const completionMap = new Map(todayCompletions.map((c) => [c.habit_id, c]))

    // Combinar today + recent para el conteo semanal
    // (todayCompletions puede tener optimistas que no están en recent aún)
    const allCompletions = [...recentCompletions, ...todayCompletions]

    return habits.map((habit): HabitWithCompletion => {
      const todayCompletion = completionMap.get(habit.id) ?? null

      if (habit.frequency_type === 'weekly') {
        const target = habit.frequency_days ?? 1
        const weekCount = getWeeklyCompletionCount(habit.id, allCompletions)
        return {
          ...habit,
          completion:     todayCompletion,
          isCompleted:    weekCount >= target,
          weeklyProgress: weekCount,
          weeklyTarget:   target,
        }
      }

      return {
        ...habit,
        completion:  todayCompletion,
        isCompleted: completionMap.has(habit.id),
      }
    })
  }, [habits, todayCompletions, recentCompletions])
  // La fecha (today) no cambia durante una sesión, no hace falta
  // como dep. Si el usuario usa la app después de medianoche,
  // el store se recarga y hábitos/completions cambian solos.
}

/**
 * Versión derivada: solo el conteo de hábitos completados hoy.
 * Más eficiente que llamar useHabitsWithCompletions().filter().length
 * cuando solo se necesita el número.
 */
export function useCompletedTodayCount(): number {
  const habitsData = useHabitsWithCompletions()
  return useMemo(
    () => habitsData.filter((h) => h.isCompleted).length,
    [habitsData]
  )
}

/**
 * Versión derivada: tasa de completions del día (0-1).
 */
export function useTodayCompletionRate(): number {
  const habitsData = useHabitsWithCompletions()
  return useMemo(() => {
    if (habitsData.length === 0) return 0
    return habitsData.filter((h) => h.isCompleted).length / habitsData.length
  }, [habitsData])
}
