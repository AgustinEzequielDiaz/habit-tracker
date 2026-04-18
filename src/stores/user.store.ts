import { create } from 'zustand'
import { User } from '@/types'
import { supabase } from '@/services/supabase'
import { getLevelFromXP, getXPToNextLevel, getLevelProgress } from '@/constants/achievements'

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null

  // Computed
  level: number
  xpToNextLevel: number
  levelProgress: number  // 0-1

  // Actions
  loadUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  level: 1,
  xpToNextLevel: 200,
  levelProgress: 0,

  loadUser: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser.user) {
        set({ user: null, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single()

      if (error) throw error

      const user = data as User
      set({
        user,
        isLoading: false,
        level: getLevelFromXP(user.total_xp),
        xpToNextLevel: getXPToNextLevel(user.total_xp),
        levelProgress: getLevelProgress(user.total_xp),
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar el perfil',
        isLoading: false,
      })
    }
  },

  updateUser: async (updates) => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      const updated = data as User
      set({
        user: updated,
        level: getLevelFromXP(updated.total_xp),
        xpToNextLevel: getXPToNextLevel(updated.total_xp),
        levelProgress: getLevelProgress(updated.total_xp),
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al actualizar el perfil' })
    }
  },

  setUser: (user) => {
    if (user) {
      set({
        user,
        level: getLevelFromXP(user.total_xp),
        xpToNextLevel: getXPToNextLevel(user.total_xp),
        levelProgress: getLevelProgress(user.total_xp),
      })
    } else {
      set({ user: null, level: 1, xpToNextLevel: 200, levelProgress: 0 })
    }
  },

  clearError: () => set({ error: null }),
}))
