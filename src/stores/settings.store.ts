import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ACCENT_COLORS } from '@/constants/theme'

const STORAGE_KEY = '@habit_tracker_settings'

export type FabAction = 'quick_complete' | 'new_habit' | 'log_mood' | 'write_note'

interface SettingsState {
  // Color de acento personalizado (light/dark pair)
  accentColor: { light: string; dark: string } | null
  accentColorName: string | null
  // Emoji de avatar (también se guarda en la DB vía avatar_url)
  avatarEmoji: string | null
  // Tiempo preferido de notificación (HH:MM)
  notificationTime: string
  // Acción del botón flotante (FAB)
  fabAction: FabAction
  // Hydration
  isHydrated: boolean

  // Actions
  setAccentColor: (name: string) => Promise<void>
  setAvatarEmoji: (emoji: string) => Promise<void>
  setNotificationTime: (time: string) => Promise<void>
  setFabAction: (action: FabAction) => Promise<void>
  hydrate: () => Promise<void>
  resetToDefaults: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  accentColor: null,
  accentColorName: null,
  avatarEmoji: null,
  notificationTime: '08:00',
  fabAction: 'quick_complete',
  isHydrated: false,

  // ─────────────────────────────────────────
  // Cambiar color de acento
  // ─────────────────────────────────────────
  setAccentColor: async (name) => {
    const found = ACCENT_COLORS.find((c) => c.name === name)
    if (!found) return
    set({ accentColor: { light: found.light, dark: found.dark }, accentColorName: name })
    await persist(get())
  },

  // ─────────────────────────────────────────
  // Cambiar emoji de avatar
  // ─────────────────────────────────────────
  setAvatarEmoji: async (emoji) => {
    set({ avatarEmoji: emoji })
    await persist(get())
  },

  // ─────────────────────────────────────────
  // Cambiar horario de notificación preferido
  // ─────────────────────────────────────────
  setNotificationTime: async (time) => {
    set({ notificationTime: time })
    await persist(get())
  },

  // ─────────────────────────────────────────
  // Cambiar acción del botón flotante
  // ─────────────────────────────────────────
  setFabAction: async (action) => {
    set({ fabAction: action })
    await persist(get())
  },

  // ─────────────────────────────────────────
  // Cargar settings guardados (llamar al inicializar la app)
  // ─────────────────────────────────────────
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        set({
          accentColor: saved.accentColor ?? null,
          accentColorName: saved.accentColorName ?? null,
          avatarEmoji: saved.avatarEmoji ?? null,
          notificationTime: saved.notificationTime ?? '08:00',
          fabAction: saved.fabAction ?? 'quick_complete',
        })
      }
    } catch (e) {
      console.warn('Settings hydration failed:', e)
    } finally {
      set({ isHydrated: true })
    }
  },

  // ─────────────────────────────────────────
  // Restablecer a defaults
  // ─────────────────────────────────────────
  resetToDefaults: async () => {
    set({ accentColor: null, accentColorName: null, avatarEmoji: null, notificationTime: '08:00', fabAction: 'quick_complete' })
    await AsyncStorage.removeItem(STORAGE_KEY)
  },
}))

// ─────────────────────────────────────────
// Helper: persistir en AsyncStorage
// ─────────────────────────────────────────
async function persist(state: SettingsState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      accentColor:      state.accentColor,
      accentColorName:  state.accentColorName,
      avatarEmoji:      state.avatarEmoji,
      notificationTime: state.notificationTime,
      fabAction:        state.fabAction,
    }))
  } catch (e) {
    console.warn('Settings persist failed:', e)
  }
}
