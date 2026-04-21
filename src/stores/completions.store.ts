import { create } from 'zustand'
import { HabitCompletion, HabitWithCompletion } from '@/types'
import { completionsService } from '@/services/completions.service'
import { todayString } from '@/utils/date'
import { useHabitsStore } from './habits.store'
import { useUserStore } from './user.store'
import { enqueue } from '@/utils/offline-queue'
import { calcAllHabitScores, calcGlobalScore } from '@/utils/scoring'
import { supabase } from '@/services/supabase'

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
    const { todayCompletions } = get()
    const completionMap = new Map(todayCompletions.map((c) => [c.habit_id, c]))

    return habits.map((habit) => ({
      ...habit,
      completion: completionMap.get(habit.id) ?? null,
      isCompleted: completionMap.has(habit.id),
    }))
  },

  completedTodayCount: () => get().todayCompletions.length,

  todayCompletionRate: () => {
    const total = useHabitsStore.getState().habits.length
    if (total === 0) return 0
    return get().todayCompletions.length / total
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

        // Recalcular score client-side después de cada toggle exitoso
        // Esto da feedback visual inmediato sin esperar al cron de la Edge Function
        get().recalculateScore()
      } catch (error) {
        // Revertir el optimistic update
        set({ todayCompletions })
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
        // Excluimos IDs optimistas — solo usamos los ya persistidos en Supabase
        ...todayCompletions.filter((tc) => !tc.id.startsWith('optimistic_')),
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

      // Persistir en Supabase para que el perfil también refleje el valor actual
      await supabase
        .from('users')
        .update({ global_score: globalScore })
        .eq('id', currentUser.id)

    } catch (err) {
      // El score fallando no debe bloquear el flujo principal de la app
      console.warn('recalculateScore error:', err)
    }
  },

  clearError: () => set({ error: null }),
}))
