import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { todayString } from '@/utils/date'
import { moodService } from '@/services/mood.service'

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

// ─────────────────────────────────────────
// Helpers de AsyncStorage (caché local)
// ─────────────────────────────────────────

async function saveLocalHistory(history: MoodEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // fallo silencioso — Supabase es la fuente de verdad
  }
}

async function loadLocalHistory(): Promise<MoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MoodEntry[]) : []
  } catch {
    return []
  }
}

export const useMoodStore = create<MoodState>((set, get) => ({
  todayMood: null,
  history: [],
  isHydrated: false,

  // ─────────────────────────────────────────
  // Registrar mood del día
  // Estrategia: optimistic local → persistir en Supabase → sync cache
  // ─────────────────────────────────────────
  setTodayMood: async (mood) => {
    const today = todayString()
    const entry: MoodEntry = { date: today, mood }

    // 1. Actualizar estado local inmediatamente
    const history = get().history.filter((e) => e.date !== today)
    const newHistory = [...history, entry]
    set({ todayMood: mood, history: newHistory })

    // 2. Persistir en AsyncStorage (offline cache)
    await saveLocalHistory(newHistory)

    // 3. Sincronizar con Supabase (fire-and-forget con manejo de error)
    try {
      await moodService.upsertToday(mood, today)
    } catch (err) {
      // Si falla la red, la entrada está guardada localmente
      // Se sincronizará cuando el usuario vuelva a abrir la app con conexión
      console.warn('[mood] Error sincronizando con Supabase:', err)
    }
  },

  // ─────────────────────────────────────────
  // Cargar historial
  // Estrategia: AsyncStorage primero (rápido) → luego Supabase (autoritativo)
  // ─────────────────────────────────────────
  loadHistory: async () => {
    // Paso 1: carga inmediata desde cache local para no bloquear la UI
    const localHistory = await loadLocalHistory()
    if (localHistory.length > 0) {
      const today = todayString()
      const todayEntry = localHistory.find((e) => e.date === today)
      set({ history: localHistory, todayMood: todayEntry?.mood ?? null, isHydrated: true })
    } else {
      set({ isHydrated: true })
    }

    // Paso 2: sincronizar con Supabase en background
    try {
      const remoteHistory = await moodService.getHistory(90)
      if (remoteHistory.length === 0 && localHistory.length > 0) {
        // Primera vez con Supabase: migrar datos locales
        await _migrateLocalToSupabase(localHistory)
        return
      }

      const today = todayString()
      const todayEntry = remoteHistory.find((e) => e.date === today)

      // Actualizar estado y cache con datos remotos (más completos y confiables)
      set({ history: remoteHistory, todayMood: todayEntry?.mood ?? null })
      await saveLocalHistory(remoteHistory)
    } catch (err) {
      // Sin conexión: datos locales son suficientes
      console.warn('[mood] Sin conexión, usando cache local:', err)
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

// ─────────────────────────────────────────
// Migración one-time: AsyncStorage → Supabase
// Solo corre cuando Supabase está vacío pero hay datos locales
// ─────────────────────────────────────────
async function _migrateLocalToSupabase(localHistory: MoodEntry[]): Promise<void> {
  try {
    // Upsert cada entrada (en serie para no saturar la conexión)
    for (const entry of localHistory) {
      await moodService.upsertToday(entry.mood, entry.date, entry.note)
    }
    console.info(`[mood] Migradas ${localHistory.length} entradas locales a Supabase`)
  } catch (err) {
    console.warn('[mood] Error durante migración local→Supabase:', err)
  }
}
