import { supabase } from './supabase'
import { HabitCompletion } from '@/types'
import { todayString } from '@/utils/date'

export const completionsService = {
  // ─────────────────────────────────────────
  // Completions de un día específico
  // ─────────────────────────────────────────
  async getForDate(date: string = todayString()): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('completed_date', date)
      .order('completed_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as HabitCompletion[]
  },

  // ─────────────────────────────────────────
  // Completions de un rango de fechas
  // ─────────────────────────────────────────
  async getForRange(fromDate: string, toDate: string): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .gte('completed_date', fromDate)
      .lte('completed_date', toDate)
      .order('completed_date', { ascending: false })

    if (error) throw error
    return (data ?? []) as HabitCompletion[]
  },

  // ─────────────────────────────────────────
  // Completions de un hábito específico
  // ─────────────────────────────────────────
  async getForHabit(habitId: string, limit = 90): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as HabitCompletion[]
  },

  // ─────────────────────────────────────────
  // Completar un hábito
  // ─────────────────────────────────────────
  async complete(
    habitId: string,
    date: string = todayString(),
    value?: number,
    note?: string
  ): Promise<HabitCompletion> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('habit_completions')
      .upsert(
        {
          habit_id: habitId,
          user_id: user.user.id,
          completed_date: date,
          value: value ?? null,
          note: note ?? null,
          source: 'manual',
        },
        { onConflict: 'habit_id,user_id,completed_date' }
      )
      .select()
      .single()

    if (error) throw error
    return data as HabitCompletion
  },

  // ─────────────────────────────────────────
  // Desmarcar un hábito
  // ─────────────────────────────────────────
  async uncomplete(habitId: string, date: string = todayString()): Promise<void> {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_date', date)

    if (error) throw error
  },

  // ─────────────────────────────────────────
  // Toggle: completa o descompleta según estado actual
  // ─────────────────────────────────────────
  async toggle(
    habitId: string,
    isCurrentlyCompleted: boolean,
    date: string = todayString(),
    value?: number
  ): Promise<HabitCompletion | null> {
    if (isCurrentlyCompleted) {
      await completionsService.uncomplete(habitId, date)
      return null
    } else {
      return await completionsService.complete(habitId, date, value)
    }
  },
}
