import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { todayString } from '@/utils/date'

// Mood: 1 (muy mal) → 5 (excelente)
export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  date: string      // YYYY-MM-DD
  mood: MoodLevel
  note?: string
}

interface MoodState {
  // Estado
  todayMood: MoodLevel | null
  history: MoodEntry[]
  isHydrated: boolean

  // Actions
  setTodayMood: (mood: MoodLevel) => Promise<void>
  loadHistory: () => Promise<void>
  getMoodForDate: (date: string) => MoodLevel | null
  getAverageMoodLast7Days: () => number | null
}

const STORAGE_KEY = '@habit_tracker_mood_v1'

export const useMoodStore = create<MoodState>((set, get) => ({
  todayMood: null,
  history: [],
  isHydrated: false,

  setTodayMood: async (mood) => {
    const today = todayString()
    const entry: MoodEntry = { date: today, mood }

    // Actualizar history (reemplazar si ya hay entrada de hoy)
    const history = get().history.filter((e) => e.date !== today)
    const newHistory = [...history, entry]

    set({ todayMood: mood, history: newHistory })
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
  },

  loadHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const history: MoodEntry[] = JSON.parse(raw)
        const today = todayString()
        const todayEntry = history.find((e) => e.date === today)
        set({
          history,
          todayMood: todayEntry?.mood ?? null,
          isHydrated: true,
        })
      } else {
        set({ isHydrated: true })
      }
    } catch {
      set({ isHydrated: true })
    }
  },

  getMoodForDate: (date) => {
    return get().history.find((e) => e.date === date)?.mood ?? null
  },

  getAverageMoodLast7Days: () => {
    const history = get().history
    if (history.length === 0) return null

    const today = new Date()
    const entries: MoodEntry[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = history.find((e) => e.date === dateStr)
      if (entry) entries.push(entry)
    }
    if (entries.length === 0) return null
    return entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
  },
}))
