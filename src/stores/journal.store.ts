import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { todayString } from '@/utils/date'
import { journalService } from '@/services/journal.service'

export interface JournalEntry {
  date: string       // YYYY-MM-DD
  text: string
  updatedAt: string
}

interface JournalState {
  todayEntry: string
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

// ─────────────────────────────────────────
// Helpers de AsyncStorage (caché local)
// ─────────────────────────────────────────

async function saveLocalHistory(history: JournalEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // fallo silencioso
  }
}

async function loadLocalHistory(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as JournalEntry[]) : []
  } catch {
    return []
  }
}

export const useJournalStore = create<JournalState>((set, get) => ({
  todayEntry: '',
  history: [],
  isHydrated: false,
  isSaving: false,

  setTodayEntry: (text) => {
    set({ todayEntry: text })
  },

  // ─────────────────────────────────────────
  // Guardar la nota de hoy
  // Estrategia: local primero → Supabase en background
  // Si el texto está vacío, eliminar la entrada
  // ─────────────────────────────────────────
  saveTodayEntry: async () => {
    const { todayEntry, history } = get()
    const today = todayString()
    const trimmed = todayEntry.trim()

    set({ isSaving: true })

    // Actualizar historia local
    let newHistory: JournalEntry[]
    if (trimmed) {
      const entry: JournalEntry = {
        date:      today,
        text:      trimmed,
        updatedAt: new Date().toISOString(),
      }
      newHistory = [...history.filter((e) => e.date !== today), entry]
    } else {
      // Texto vacío → eliminar la entrada del día
      newHistory = history.filter((e) => e.date !== today)
    }

    set({ history: newHistory, isSaving: false })

    // Persistir en AsyncStorage
    await saveLocalHistory(newHistory)

    // Sincronizar con Supabase en background
    try {
      if (trimmed) {
        await journalService.upsertEntry(today, trimmed)
      } else {
        await journalService.deleteEntry(today)
      }
    } catch (err) {
      // Sin conexión: la entrada está guardada localmente y se sincronizará después
      console.warn('[journal] Error sincronizando con Supabase:', err)
    }
  },

  // ─────────────────────────────────────────
  // Cargar historial
  // Estrategia: AsyncStorage primero → Supabase en background
  // ─────────────────────────────────────────
  loadHistory: async () => {
    // Paso 1: carga inmediata desde cache local
    const localHistory = await loadLocalHistory()
    if (localHistory.length > 0) {
      const today = todayString()
      const todayEntry = localHistory.find((e) => e.date === today)
      set({
        history:    localHistory,
        todayEntry: todayEntry?.text ?? '',
        isHydrated: true,
      })
    } else {
      set({ isHydrated: true })
    }

    // Paso 2: sincronizar con Supabase en background
    try {
      const remoteHistory = await journalService.getHistory(90)

      if (remoteHistory.length === 0 && localHistory.length > 0) {
        // Primera vez con Supabase: migrar datos locales
        await _migrateLocalToSupabase(localHistory)
        return
      }

      const today = todayString()
      const todayEntry = remoteHistory.find((e) => e.date === today)

      set({
        history:    remoteHistory,
        todayEntry: todayEntry?.text ?? '',
      })
      await saveLocalHistory(remoteHistory)
    } catch (err) {
      // Sin conexión: datos locales son suficientes
      console.warn('[journal] Sin conexión, usando cache local:', err)
    }
  },

  getEntryForDate: (date) => {
    return get().history.find((e) => e.date === date)?.text ?? null
  },
}))

// ─────────────────────────────────────────
// Migración one-time: AsyncStorage → Supabase
// Solo corre cuando Supabase está vacío pero hay datos locales
// ─────────────────────────────────────────
async function _migrateLocalToSupabase(localHistory: JournalEntry[]): Promise<void> {
  try {
    for (const entry of localHistory) {
      if (entry.text.trim()) {
        await journalService.upsertEntry(entry.date, entry.text)
      }
    }
    console.info(`[journal] Migradas ${localHistory.length} entradas locales a Supabase`)
  } catch (err) {
    console.warn('[journal] Error durante migración local→Supabase:', err)
  }
}
