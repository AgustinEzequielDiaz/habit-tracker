import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { todayString } from '@/utils/date'

export interface JournalEntry {
  date: string   // YYYY-MM-DD
  text: string
  updatedAt: string
}

interface JournalState {
  todayEntry: string        // texto de la nota de hoy
  history: JournalEntry[]
  isHydrated: boolean
  isSaving: boolean

  // Actions
  setTodayEntry: (text: string) => void
  saveTodayEntry: () => Promise<void>
  loadHistory: () => Promise<void>
  getEntryForDate: (date: string) => string | null
}

const STORAGE_KEY = '@habit_tracker_journal_v1'

export const useJournalStore = create<JournalState>((set, get) => ({
  todayEntry: '',
  history: [],
  isHydrated: false,
  isSaving: false,

  setTodayEntry: (text) => {
    set({ todayEntry: text })
  },

  saveTodayEntry: async () => {
    const { todayEntry, history } = get()
    const today = todayString()

    set({ isSaving: true })

    const entry: JournalEntry = {
      date: today,
      text: todayEntry.trim(),
      updatedAt: new Date().toISOString(),
    }

    const newHistory = [
      ...history.filter((e) => e.date !== today),
      ...(entry.text ? [entry] : []),  // no guardar entradas vacías
    ]

    set({ history: newHistory, isSaving: false })
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
  },

  loadHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const history: JournalEntry[] = JSON.parse(raw)
        const today = todayString()
        const todayEntry = history.find((e) => e.date === today)
        set({ history, todayEntry: todayEntry?.text ?? '', isHydrated: true })
      } else {
        set({ isHydrated: true })
      }
    } catch {
      set({ isHydrated: true })
    }
  },

  getEntryForDate: (date) => {
    return get().history.find((e) => e.date === date)?.text ?? null
  },
}))
