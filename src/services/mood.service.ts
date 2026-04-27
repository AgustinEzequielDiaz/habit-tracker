import { supabase } from './supabase'
import { MoodLevel, MoodEntry } from '@/stores/mood.store'

export const moodService = {
  // ─────────────────────────────────────────
  // Upsert del mood de hoy (crea o actualiza)
  // UNIQUE constraint: (user_id, entry_date)
  // ─────────────────────────────────────────
  async upsertToday(mood: MoodLevel, date: string, note?: string): Promise<void> {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('mood_entries')
      .upsert(
        {
          user_id:    authData.user.id,
          entry_date: date,
          mood,
          note:       note ?? null,
        },
        { onConflict: 'user_id,entry_date' }
      )

    if (error) throw error
  },

  // ─────────────────────────────────────────
  // Obtener historial de los últimos N días
  // ─────────────────────────────────────────
  async getHistory(days = 90): Promise<MoodEntry[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const fromDate = since.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('mood_entries')
      .select('entry_date, mood, note')
      .gte('entry_date', fromDate)
      .order('entry_date', { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
      date: row.entry_date as string,
      mood: row.mood as MoodLevel,
      note: row.note ?? undefined,
    }))
  },
}
