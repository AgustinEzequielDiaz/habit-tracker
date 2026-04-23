import { supabase } from './supabase'
import { Habit, CreateHabitForm, UpdateHabitForm } from '@/types'
import { todayString } from '@/utils/date'

export const habitsService = {
  // ─────────────────────────────────────────
  // Obtener hábitos activos del usuario con racha actual
  // Devuelve TODOS los activos no-archivados; el store separa
  // los de hoy vs los futuros client-side.
  // ─────────────────────────────────────────
  async getActive(): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits_with_streaks')
      .select('*')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('order_index', { ascending: true })

    if (error) throw error
    return (data ?? []) as Habit[]
  },

  // ─────────────────────────────────────────
  // Crear nuevo hábito (con soporte a start_date / end_date)
  // ─────────────────────────────────────────
  async create(form: CreateHabitForm): Promise<Habit> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('No autenticado')

    // Obtener el último order_index
    const { data: existing } = await supabase
      .from('habits')
      .select('order_index')
      .eq('user_id', user.user.id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0
    const today = todayString()

    // Payload base (siempre disponible sin migración V3)
    const basePayload = {
      user_id:      user.user.id,
      name:         form.name,
      description:  form.description ?? null,
      category:     form.category,
      type:         form.type,
      difficulty:   form.difficulty,
      target_value: form.target_value ?? null,
      unit:         form.unit ?? null,
      color:        form.color,
      icon:         form.icon,
      order_index:  nextIndex,
    }

    // Intentar con los campos de scheduling (requiere migración V3)
    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...basePayload,
        start_date: form.start_date ?? today,
        end_date:   form.end_date ?? null,
      })
      .select()
      .single()

    // Si Supabase rechaza start_date/end_date (migración no ejecutada),
    // reintentamos sin esos campos — el hábito se crea igual con defaults.
    if (error) {
      const isMissingColumn =
        error.message.includes('start_date') ||
        error.message.includes('end_date') ||
        error.code === '42703' // PostgreSQL: column does not exist
      if (isMissingColumn) {
        const { data: data2, error: error2 } = await supabase
          .from('habits')
          .insert(basePayload)
          .select()
          .single()
        if (error2) throw error2
        return data2 as Habit
      }
      throw error
    }

    return data as Habit
  },

  // ─────────────────────────────────────────
  // Actualizar hábito
  // ─────────────────────────────────────────
  async update(id: string, updates: UpdateHabitForm): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Habit
  },

  // ─────────────────────────────────────────
  // Archivar hábito (soft delete)
  // ─────────────────────────────────────────
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ is_archived: true, is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  // ─────────────────────────────────────────
  // Reordenar hábitos (drag & drop)
  // ─────────────────────────────────────────
  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      supabase.from('habits').update({ order_index: index }).eq('id', id)
    )
    await Promise.all(updates)
  },

  // ─────────────────────────────────────────
  // Contar hábitos activos (para achievements)
  // ─────────────────────────────────────────
  async countActive(): Promise<number> {
    const { count, error } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_archived', false)

    if (error) throw error
    return count ?? 0
  },
}
