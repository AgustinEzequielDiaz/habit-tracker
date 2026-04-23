// ============================================================
// TIPOS GLOBALES — Habit Tracker
// ============================================================

// ─────────────────────────────────────────
// Enums
// ─────────────────────────────────────────

export type HabitCategory = 'fitness' | 'productividad' | 'bienestar' | 'rutinas'
export type HabitType = 'binary' | 'measurable' | 'timed'
export type HabitDifficulty = 'easy' | 'normal' | 'hard'
export type FrequencyType = 'daily' | 'weekly' | 'custom'
export type CompletionSource = 'manual' | 'offline_sync'

// ─────────────────────────────────────────
// Entidades de base de datos
// ─────────────────────────────────────────

export interface User {
  id: string
  username: string | null
  display_name: string
  avatar_url: string | null
  level: number
  total_xp: number
  global_score: number
  streak_best: number
  streak_freeze_tokens: number
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface StreakFreeze {
  id: string
  user_id: string
  habit_id: string
  freeze_date: string        // YYYY-MM-DD
  used_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  category: HabitCategory
  type: HabitType
  difficulty: HabitDifficulty
  target_value: number | null
  unit: string | null
  color: string
  icon: string
  order_index: number
  is_active: boolean
  is_archived: boolean
  // Scheduling (V3) — opcionales para compatibilidad con instancias sin migración
  start_date?: string   // YYYY-MM-DD, default hoy
  end_date?: string | null  // YYYY-MM-DD, null = sin fecha límite
  // Frecuencia (V5) — opcionales para retrocompatibilidad
  frequency_type?: FrequencyType   // default 'daily'
  frequency_days?: number          // weekly: cuántas veces por semana (1-7)
  frequency_weekdays?: number[]    // custom: días de la semana (0=Dom, 1=Lun...6=Sab)
  created_at: string
  updated_at: string
  // Joined from habits_with_streaks view
  current_streak?: number
  streak_start?: string | null
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_date: string    // YYYY-MM-DD
  completed_at: string      // ISO timestamp
  value: number | null
  note: string | null
  source: CompletionSource
  created_at: string
}

export interface HabitStreak {
  id: string
  habit_id: string
  user_id: string
  start_date: string
  end_date: string | null   // null = racha activa
  length_days: number
  created_at: string
}

export interface DailySummary {
  id: string
  user_id: string
  summary_date: string      // YYYY-MM-DD
  habits_total: number
  habits_completed: number
  completion_rate: number   // 0-100
  global_score: number      // 0-100
  xp_earned: number
  created_at: string
}

export interface NotificationPrefs {
  id: string
  user_id: string
  enabled: boolean
  reminder_time: string     // HH:MM:SS
  ignored_count: number
  last_interaction_at: string | null
  push_token: string | null
  updated_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_key: string
  unlocked_at: string
}

// ─────────────────────────────────────────
// Tipos de UI / App
// ─────────────────────────────────────────

export interface HabitWithCompletion extends Habit {
  completion: HabitCompletion | null
  isCompleted: boolean
  // Weekly frequency extras
  weeklyProgress?: number   // completions this week (for weekly habits)
  weeklyTarget?: number     // target per week (for weekly habits)
}

export interface TodayData {
  habits: HabitWithCompletion[]
  completedCount: number
  totalCount: number
  completionRate: number    // 0-1
  xpEarned: number
  globalScore: number
}

// ─────────────────────────────────────────
// Offline queue
// ─────────────────────────────────────────

export type OfflineOperationType = 'complete_habit' | 'uncomplete_habit'

export interface OfflineOperation {
  id: string
  operation: OfflineOperationType
  payload: {
    habit_id: string
    completed_date: string
    value?: number
    note?: string
  }
  created_at: string
  synced: boolean
}

// ─────────────────────────────────────────
// Formularios
// ─────────────────────────────────────────

export interface CreateHabitForm {
  name: string
  description?: string
  category: HabitCategory
  type: HabitType
  difficulty: HabitDifficulty
  target_value?: number
  unit?: string
  color: string
  icon: string
  // Scheduling (V3)
  start_date?: string   // YYYY-MM-DD, undefined = hoy
  end_date?: string | null  // YYYY-MM-DD, undefined/null = sin fecha límite
  // Frecuencia (V5)
  frequency_type?: FrequencyType
  frequency_days?: number
  frequency_weekdays?: number[]
}

export interface UpdateHabitForm extends Partial<CreateHabitForm> {
  is_active?: boolean
  is_archived?: boolean
  order_index?: number
}

// ─────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────

export interface AchievementDefinition {
  key: string
  name: string
  description: string
  xp: number
  icon: string
}

// ─────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────

export interface HabitScore {
  habitId: string
  score: number             // 0-100
  completionRate: number    // 0-1
  currentStreak: number
}

export interface UserScoreData {
  globalScore: number       // 0-100
  habitScores: HabitScore[]
  level: number
  totalXp: number
  xpToNextLevel: number
}
