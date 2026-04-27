import { supabase } from './supabase'
import { JournalEntry } from '@/stores/journal.store'

export const journalService = {
  // ─────────────────────────────────────────
  // Upsert de una entrada (crea o actualiza)
  // UNIQUE constraint: (user_id, entry_date)
  // ─────────────────────────────────────────
  async upsertEntry(date: string, text: string): Promise<void> {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('journal_entries')
      .upsert(
        {
          user_id:    authData.user.id,
          entry_date: date,
          text:       text.trim(),
        },
        { onConflict: 'user_id,entry_date' }
      )

    if (error) throw error
  },

  // ─────────────────────────────────────────
  // Obtener historial de los últimos N días
  // ─────────────────────────────────────────
  async getHistory(days = 90): Promise<JournalEntry[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const fromDate = since.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('journal_entries')
      .select('entry_date, text, updated_at')
      .gte('entry_date', fromDate)
      .order('entry_date', { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
      date:      row.entry_date as string,
      text:      row.text as string,
      updatedAt: row.updated_at as string,
    }))
  },

  // ─────────────────────────────────────────
  // Eliminar una entrada (para el caso en que
  // el usuario borra el texto y guarda vacío)
  // ─────────────────────────────────────────
  async deleteEntry(date: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('entry_date', date)

    if (error) throw error
  },
}
