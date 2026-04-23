import { create } from 'zustand'
import { HabitCompletion, HabitWithCompletion } from '@/types'
import { completionsService } from '@/services/completions.service'
import { todayString } from '@/utils/date'
import { useHabitsStore } from './habits.store'
import { useUserStore } from './user.store'
import { enqueue } from '@/utils/offline-queue'
import { calcAllHabitScores, calcGlobalScore } from '@/utils/scoring'
import { supabase } from '@/services/supabase'
import { getWeeklyCompletionCount } from '@/utils/frequency'

interface CompletionsState {
  // Completions del día actual
  todayCompletions: HabitCompletion[]
  // Completions de los últimos 30 días (para scoring)
  recentCompletions: HabitCompletion[]
  isLoading: boolean
  error: string | null

  // Computed
  habitsWithCompletions: () => HabitWithCompletion[]
  completedTodayCount: () => number
  todayCompletionRate: () => number

  // Actions
  loadTodayCompletions: () => Promise<void>
  loadRecentCompletions: () => Promise<void>
  toggleCompletion: (
    habitId: string,
    isOnline: boolean,
    value?: number
  ) => Promise<void>
  recalculateScore: () => Promise<void>
  clearError: () => void
}

export const useCompletionsStore = create<CompletionsState>((set, get) => ({
  todayCompletions: [],
  recentCompletions: [],
  isLoading: false,
  error: null,

  // ─────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────

  habitsWithCompletions: () => {
    const habits = useHabitsStore.getState().habits
    const { todayCompletions, recentCompletions } = get()
    const completionMap = new Map(todayCompletions.map((c) => [c.habit_id, c]))
    // Combine today + recent for weekly count (today completions may not be in recent yet)
    const allCompletions = [...recentCompletions, ...todayCompletions]

    return habits.map((habit): HabitWithCompletion => {
      const todayCompletion = completionMap.get(habit.id) ?? null

      if (habit.frequency_type === 'weekly') {
        const target = habit.frequency_days ?? 1
        const weekCount = getWeeklyCompletionCount(habit.id, allCompletions)
        return {
          ...habit,
          completion: todayCompletion,
          isCompleted: weekCount >= target,
          weeklyProgress: weekCount,
          weeklyTarget: target,
        }
      }

      return {
        ...habit,
        completion: todayCompletion,
        isCompleted: completionMap.has(habit.id),
      }
    })
  },

  completedTodayCount: () => {
    // Use habitsWithCompletions to respect weekly logic
    return get().habitsWithCompletions().filter((h) => h.isCompleted).length
  },

  todayCompletionRate: () => {
    const habits = get().habitsWithCompletions()
    if (habits.length === 0) return 0
    return habits.filter((h) => h.isCompleted).length / habits.length
  },

  // ─────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────

  loadTodayCompletions: async () => {
    set({ isLoading: true, error: null })
    try {
      const completions = await completionsService.getForDate(todayString())
      set({ todayCompletions: completions, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar completions',
        isLoading: false,
      })
    }
  },

  loadRecentCompletions: async () => {
    try {
      const today = todayString()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

      const completions = await completionsService.getForRange(fromDate, today)
      set({ recentCompletions: completions })
    } catch (error) {
      console.warn('Error cargando completions recientes:', error)
    }
  },

  toggleCompletion: async (habitId, isOnline, value) => {
    const { todayCompletions } = get()
    const today = todayString()
    const existingIndex = todayCompletions.findIndex((c) => c.habit_id === habitId)
    const isCompleted = existingIndex !== -1

    // Optimistic update — actualiza la UI inmediatamente
    if (isCompleted) {
      set({ todayCompletions: todayCompletions.filter((c) => c.habit_id !== habitId) })
    } else {
      const optimistic: HabitCompletion = {
        id: `optimistic_${habitId}`,
        habit_id: habitId,
        user_id: '',
        completed_date: today,
        completed_at: new Date().toISOString(),
        value: value ?? null,
        note: null,
        source: 'manual',
        created_at: new Date().toISOString(),
      }
      set({ todayCompletions: [...todayCompletions, optimistic] })
    }

    // Score actualiza INMEDIATAMENTE con el estado optimista — sin esperar red
    get().recalculateScore()

    if (isOnline) {
      try {
        const result = await completionsService.toggle(habitId, isCompleted, today, value)
        // Reemplazar el optimistic con el real
        if (result) {
          set((state) => ({
            todayCompletions: state.todayCompletions.map((c) =>
              c.id === `optimistic_${habitId}` ? result : c
            ),
          }))
        }

        // Confirmar score con el ID real (diferencia mínima, pero consistente)
        get().recalculateScore()
      } catch (error) {
        // Revertir el optimistic update y el score
        set({ todayCompletions })
        get().recalculateScore()
        set({ error: 'Error al sincronizar. Reintentando...' })
      }
    } else {
      // Sin internet: guardar en cola offline
      const operation = isCompleted ? 'uncomplete_habit' : 'complete_habit'
      await enqueue(operation, { habit_id: habitId, completed_date: today, value })
    }
  },

  // ─────────────────────────────────────────
  // Recalcular score global del usuario (client-side)
  //
  // Por qué aquí y no en el Edge Function:
  //   El Edge Function (calculate-daily-score) corre como cron nocturno y
  //   calcula XP acumulado, streaks, achievements. Para el score visible en
  //   tiempo real durante la sesión del usuario, lo calculamos client-side
  //   y lo persistimos en Supabase. El cron lo sobreescribirá con el valor
  //   definitivo cuando corra.
  //
  // Solo actualizamos global_score — XP y level los maneja el Edge Function
  // para evitar doble-conteo al hacer toggle varias veces en el día.
  // ─────────────────────────────────────────
  recalculateScore: async () => {
    try {
      const habits = useHabitsStore.getState().habits
      if (habits.length === 0) return

      const { recentCompletions, todayCompletions } = get()
      const today = todayString()

      // REGLA CLAVE: todayCompletions es la fuente autoritativa para el día actual.
      // recentCompletions puede tener datos de hoy de cuando cargó la pantalla
      // (stale), así que lo usamos SOLO para días anteriores.
      // Esto evita que deschequear un hábito no baje el score porque recentCompletions
      // todavía tiene la completion de hoy.
      const completionsForScoring = [
        // Días anteriores: desde recentCompletions (sin tocar hoy)
        ...recentCompletions.filter((c) => c.completed_date !== today),
        // Hoy: desde todayCompletions (siempre actualizado tras cada toggle)
        // Incluimos optimistas — el score responde al toque, sin esperar red
        ...todayCompletions,
      ]

      // Calcular score global ponderado
      const habitScores = calcAllHabitScores(habits, completionsForScoring)
      const globalScore = Math.round(calcGlobalScore(habitScores) * 100) / 100

      // Actualizar user store localmente (la UI se actualiza al instante)
      const currentUser = useUserStore.getState().user
      if (!currentUser) return

      useUserStore.getState().setUser({
        ...currentUser,
        global_score: globalScore,
      })

      // Persistir en Supabase fire-and-forget — no bloquea la UI
      supabase
        .from('users')
        .update({ global_score: globalScore })
        .eq('id', currentUser.id)
        .then()

    } catch (err) {
      // El score fallando no debe bloquear el flujo principal de la app
      console.warn('recalculateScore error:', err)
    }
  },

  clearError: () => set({ error: null }),
}))
