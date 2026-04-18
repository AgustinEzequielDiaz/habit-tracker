import { AchievementDefinition } from '@/types'

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // Onboarding
  first_habit: {
    key: 'first_habit',
    name: 'Primer paso',
    description: 'Creaste tu primer hábito',
    xp: 50,
    icon: '🌱',
  },
  first_completion: {
    key: 'first_completion',
    name: 'Primera marca',
    description: 'Completaste un hábito por primera vez',
    xp: 25,
    icon: '✅',
  },

  // Streaks
  streak_3: {
    key: 'streak_3',
    name: '3 días seguidos',
    description: 'Mantuviste un hábito 3 días consecutivos',
    xp: 50,
    icon: '🔥',
  },
  streak_7: {
    key: 'streak_7',
    name: 'Una semana',
    description: 'Mantuviste un hábito 7 días seguidos',
    xp: 100,
    icon: '📅',
  },
  streak_30: {
    key: 'streak_30',
    name: 'Un mes imparable',
    description: 'Mantuviste un hábito 30 días consecutivos',
    xp: 300,
    icon: '🏆',
  },

  // Completions diarias
  perfect_day: {
    key: 'perfect_day',
    name: 'Día perfecto',
    description: 'Completaste todos tus hábitos en un día',
    xp: 75,
    icon: '⭐',
  },
  perfect_week: {
    key: 'perfect_week',
    name: 'Semana perfecta',
    description: 'Completaste todos tus hábitos 7 días seguidos',
    xp: 200,
    icon: '💫',
  },

  // Score
  score_70: {
    key: 'score_70',
    name: 'Consistente',
    description: 'Alcanzaste un score de consistencia del 70%',
    xp: 100,
    icon: '📈',
  },
  score_90: {
    key: 'score_90',
    name: 'Alta consistencia',
    description: 'Alcanzaste un score de consistencia del 90%',
    xp: 250,
    icon: '🎯',
  },

  // Cantidad de hábitos
  habits_3: {
    key: 'habits_3',
    name: 'En ritmo',
    description: 'Tenés 3 hábitos activos',
    xp: 50,
    icon: '🎪',
  },
  habits_5: {
    key: 'habits_5',
    name: 'Construyendo rutinas',
    description: 'Tenés 5 hábitos activos',
    xp: 100,
    icon: '🎭',
  },

  // Tiempo en la app
  days_7: {
    key: 'days_7',
    name: 'Primera semana',
    description: 'Llevas 7 días usando la app',
    xp: 75,
    icon: '🗓️',
  },
  days_30: {
    key: 'days_30',
    name: 'Un mes dedicado',
    description: 'Llevas 30 días usando la app',
    xp: 150,
    icon: '📆',
  },
}

// Niveles de XP
export const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]

export const LEVEL_NAMES = [
  'Principiante',
  'En camino',
  'Constante',
  'Disciplinado',
  'Enfocado',
  'Avanzado',
  'Experto',
  'Maestro',
  'Élite',
  'Leyenda',
]

export function getLevelFromXP(totalXp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return level
}

export function getXPToNextLevel(totalXp: number): number {
  const level = getLevelFromXP(totalXp)
  if (level >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[level] - totalXp
}

export function getLevelProgress(totalXp: number): number {
  const level = getLevelFromXP(totalXp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[level - 1]
  if (nextThreshold === currentThreshold) return 1
  return (totalXp - currentThreshold) / (nextThreshold - currentThreshold)
}
