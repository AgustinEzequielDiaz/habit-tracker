import { create } from 'zustand'
import { HabitCompletion, HabitWithCompletion } from '@/types'
import { completionsService } from '@/services/completions.service'
import { todayString } from '@/utils/date'
import { useHabitsStore } from './habits.store'
import { enqueue } from '@/utils/offline-queue'

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

  clearError: () => set({ error: null }),
}))
