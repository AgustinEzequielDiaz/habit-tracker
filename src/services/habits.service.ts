import { supabase } from './supabase'
import { Habit, CreateHabitForm, UpdateHabitForm } from '@/types'
import { todayString } from '@/utils/date'

export const habitsService = {
  // ─────────────────────────────────────────
  // Obtener hábitos activos del usuario con racha actual
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
  // Crear nuevo hábito
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

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.user.id,
        name: form.name,
        description: form.description ?? null,
        category: form.category,
        type: form.type,
        difficulty: form.difficulty,
        target_value: form.target_value ?? null,
        unit: form.unit ?? null,
        color: form.color,
        icon: form.icon,
        order_index: nextIndex,
      })
      .select()
      .single()

    if (error) throw error
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
