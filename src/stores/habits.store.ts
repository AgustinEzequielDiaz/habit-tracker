import { create } from 'zustand'
import { Habit, CreateHabitForm, UpdateHabitForm } from '@/types'
import { habitsService } from '@/services/habits.service'
import { todayString } from '@/utils/date'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de filtrado por fecha
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hábitos activos hoy:
 *   start_date <= hoy  (o no tiene start_date → retrocompatible)
 *   AND (end_date >= hoy OR end_date es null)
 */
function filterTodayHabits(habits: Habit[], today: string): Habit[] {
  return habits.filter((h) => {
    const startOk = !h.start_date || h.start_date <= today
    const endOk   = !h.end_date   || h.end_date   >= today
    return startOk && endOk
  })
}

/**
 * Hábitos próximos (start_date > hoy)
 */
function filterUpcomingHabits(habits: Habit[], today: string): Habit[] {
  return habits.filter((h) => h.start_date && h.start_date > today)
}

/**
 * Hábitos vencidos (end_date < hoy) — para mostrar en la lista de gestión
 */
function filterExpiredHabits(habits: Habit[], today: string): Habit[] {
  return habits.filter((h) => h.end_date && h.end_date < today)
}

// ─────────────────────────────────────────────────────────────────────────────

interface HabitsState {
  /** Hábitos cuyo start_date <= hoy y end_date >= hoy (o sin fechas) */
  habits: Habit[]
  /** Hábitos cuyo start_date > hoy (programados para el futuro) */
  upcomingHabits: Habit[]
  /** Hábitos cuyo end_date < hoy (challenge completado) */
  expiredHabits: Habit[]
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
  upcomingHabits: [],
  expiredHabits: [],
  isLoading: false,
  error: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null })
    try {
      const all = await habitsService.getActive()
      const today = todayString()
      set({
        habits:         filterTodayHabits(all, today),
        upcomingHabits: filterUpcomingHabits(all, today),
        expiredHabits:  filterExpiredHabits(all, today),
        isLoading: false,
      })
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
      const today = todayString()
      // Agregar al bucket correcto según start_date
      const isToday = !habit.start_date || habit.start_date <= today
      const isUpcoming = !!habit.start_date && habit.start_date > today
      set((state) => ({
        habits:         isToday   ? [...state.habits, habit] : state.habits,
        upcomingHabits: isUpcoming ? [...state.upcomingHabits, habit] : state.upcomingHabits,
      }))
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
        upcomingHabits: state.upcomingHabits.map((h) => (h.id === id ? updated : h)),
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
        habits:         state.habits.filter((h) => h.id !== id),
        upcomingHabits: state.upcomingHabits.filter((h) => h.id !== id),
        expiredHabits:  state.expiredHabits.filter((h) => h.id !== id),
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al archivar el hábito' })
      throw error
    }
  },

  reorderHabits: async (orderedIds) => {
    const { habits } = get()
    const reordered = orderedIds
      .map((id) => habits.find((h) => h.id === id))
      .filter(Boolean) as Habit[]
    set({ habits: reordered })

    try {
      await habitsService.reorder(orderedIds)
    } catch (error) {
      set({ habits, error: 'Error al reordenar' })
    }
  },

  clearError: () => set({ error: null }),
}))
