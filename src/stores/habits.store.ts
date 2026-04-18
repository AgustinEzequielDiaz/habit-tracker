import { create } from 'zustand'
import { Habit, CreateHabitForm, UpdateHabitForm } from '@/types'
import { habitsService } from '@/services/habits.service'

interface HabitsState {
  habits: Habit[]
  isLoading: boolean
  error: string | null

  // Actions
  loadHabits: () => Promise<void>
  addHabit: (form: CreateHabitForm) => Promise<Habit>
  updateHabit: (id: string, updates: UpdateHabitForm) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  reorderHabits: (orderedIds: string[]) => Promise<void>
  clearError: () => void
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null })
    try {
      const habits = await habitsService.getActive()
      set({ habits, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar los hábitos',
        isLoading: false,
      })
    }
  },

  addHabit: async (form) => {
    try {
      const habit = await habitsService.create(form)
      set((state) => ({ habits: [...state.habits, habit] }))
      return habit
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el hábito'
      set({ error: message })
      throw error
    }
  },

  updateHabit: async (id, updates) => {
    try {
      const updated = await habitsService.update(id, updates)
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updated : h)),
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al actualizar el hábito' })
      throw error
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitsService.archive(id)
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al archivar el hábito' })
      throw error
    }
  },

  reorderHabits: async (orderedIds) => {
    // Actualizar localmente primero (optimistic update)
    const { habits } = get()
    const reordered = orderedIds
      .map((id) => habits.find((h) => h.id === id))
      .filter(Boolean) as Habit[]
    set({ habits: reordered })

    try {
      await habitsService.reorder(orderedIds)
    } catch (error) {
      // Revertir en caso de error
      set({ habits, error: 'Error al reordenar' })
    }
  },

  clearError: () => set({ error: null }),
}))
