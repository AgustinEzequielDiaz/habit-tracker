import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'

interface MotivationCardProps {
  completedCount: number
  totalHabits: number
  currentStreak: number    // mayor racha activa del usuario
  globalScore: number
  displayName?: string
}

interface Message {
  emoji: string
  text: string
  accent: 'primary' | 'success' | 'warning' | 'streak'
}

function getMotivationMessage(
  completed: number,
  total: number,
  streak: number,
  score: number,
): Message {
  const rate = total > 0 ? completed / total : 0
  const hour = new Date().getHours()

  // Sin hábitos todavía
  if (total === 0) {
    return { emoji: '✨', text: 'Creá tu primer hábito para empezar a construir tu mejor versión.', accent: 'primary' }
  }

  // Día perfecto
  if (completed === total && total > 0) {
    if (streak >= 7) {
      return { emoji: '🏆', text: `¡${streak} días en racha! Sos imparable. Día perfecto conseguido.`, accent: 'success' }
    }
    return { emoji: '⭐', text: '¡Día perfecto! Completaste todos tus hábitos. Eso es disciplina de verdad.', accent: 'success' }
  }

  // Racha alta
  if (streak >= 14 && rate < 1) {
    return { emoji: '🔥', text: `${streak} días de racha. No pares ahora — te faltan solo ${total - completed} hábito${total - completed !== 1 ? 's' : ''}.`, accent: 'streak' }
  }

  // Mucho progreso (>= 70%)
  if (rate >= 0.7) {
    return { emoji: '💪', text: `Ya vas con ${completed} de ${total}. El empujón final es el más importante.`, accent: 'primary' }
  }

  // La mitad hecha
  if (rate >= 0.4 && rate < 0.7) {
    return { emoji: '🚀', text: `Mitad del camino. Cada hábito que marcás hoy refuerza quién sos mañana.`, accent: 'primary' }
  }

  // Empezando el día (mañana, ninguno completado)
  if (hour < 12 && completed === 0) {
    return { emoji: '🌅', text: 'Buenos días. Cada gran racha empezó con un primer día. Arrancá.', accent: 'primary' }
  }

  // Tarde, ninguno completado
  if (hour >= 14 && completed === 0) {
    return { emoji: '⏰', text: 'Todavía estás a tiempo. Empezar tarde es mejor que no empezar.', accent: 'warning' }
  }

  // Score alto, pocos hábitos completados
  if (score >= 70 && rate < 0.3) {
    return { emoji: '🎯', text: `Tu consistencia histórica es del ${Math.round(score)}%. Hoy es una oportunidad de sostenerla.`, accent: 'primary' }
  }

  // Score bajo — necesita motivación extra
  if (score < 30 && streak === 0) {
    return { emoji: '💡', text: 'Construir un hábito tarda 66 días en promedio. Lo importante es no rendirse.', accent: 'warning' }
  }

  // Default motivacional
  const defaults: Message[] = [
    { emoji: '🧠', text: 'Los hábitos pequeños, repetidos, generan resultados grandes.', accent: 'primary' },
    { emoji: '📈', text: 'Mejorar un 1% cada día es 37x mejor al final del año.', accent: 'primary' },
    { emoji: '⚡', text: 'La consistencia siempre le gana a la perfección.', accent: 'primary' },
  ]
  return defaults[new Date().getDate() % defaults.length]
}

export function MotivationCard({
  completedCount,
  totalHabits,
  currentStreak,
  globalScore,
  displayName,
}: MotivationCardProps) {
  const { colors } = useTheme()

  const message = useMemo(
    () => getMotivationMessage(completedCount, totalHabits, currentStreak, globalScore),
    [completedCount, totalHabits, currentStreak, globalScore],
  )

  const accentColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    streak:  colors.streak,
  }[message.accent]

  return (
    <View style={[styles.card, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}30` }]}>
      <Text style={styles.emoji}>{message.emoji}</Text>
      <Text style={[styles.text, { color: colors.text }]}>{message.text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
})
