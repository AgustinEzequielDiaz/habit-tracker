import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated'
import { HabitWithCompletion } from '@/types'
import { HabitCheckbox } from './HabitCheckbox'
import { StreakBadge } from './StreakBadge'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'
import { todayString } from '@/utils/date'
import { getFrequencyLabel } from '@/utils/frequency'

interface HabitCardProps {
  habit: HabitWithCompletion
  onToggle: (habitId: string, value?: number) => void
  onPress?: (habit: HabitWithCompletion) => void
  onRequestValue?: (habit: HabitWithCompletion) => void  // para hábitos medibles/tiempo
  atRisk?: boolean   // sin completar en los últimos 7 días
  disabled?: boolean
}

const CATEGORY_LABELS = {
  fitness:       'Fitness',
  productividad: 'Productividad',
  bienestar:     'Bienestar',
  rutinas:       'Rutinas',
}

// Calcula los días restantes hasta end_date (null si no hay fecha límite)
function getDaysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null
  const today = todayString()
  const diff = Math.round(
    (new Date(endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  )
  return diff
}

export function HabitCard({ habit, onToggle, onPress, onRequestValue, atRisk, disabled }: HabitCardProps) {
  const { colors } = useTheme()
  const feedbackOpacity = useSharedValue(0)
  const completedProgress = useSharedValue(habit.isCompleted ? 1 : 0)
  const daysRemaining = getDaysRemaining(habit.end_date)
  const isMeasurable = habit.type === 'measurable' || habit.type === 'timed'

  // Valor actual de la completion (para hábitos medibles)
  const currentValue = habit.completion?.value ?? null
  const targetValue = habit.target_value
  const valueProgress = isMeasurable && targetValue && currentValue !== null
    ? Math.min(currentValue / targetValue, 1)
    : null

  // Frecuencia
  const freqLabel = getFrequencyLabel(habit)
  const isWeekly = habit.frequency_type === 'weekly'
  const weeklyProgress = habit.weeklyProgress
  const weeklyTarget = habit.weeklyTarget

  // Animar el fondo del card cuando cambia isCompleted
  useEffect(() => {
    completedProgress.value = withTiming(habit.isCompleted ? 1 : 0, { duration: 300 })
  }, [habit.isCompleted])

  const handleToggle = useCallback(() => {
    // Para hábitos medibles/tiempo no completados: pedir valor
    if (isMeasurable && !habit.isCompleted && onRequestValue) {
      onRequestValue(habit)
      return
    }

    onToggle(habit.id)

    if (!habit.isCompleted) {
      feedbackOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 350 })
      )
    }
  }, [habit.id, habit.isCompleted, habit.type, onToggle, onRequestValue, isMeasurable])

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }))

  const cardBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completedProgress.value,
      [0, 1],
      [colors.card, `${habit.color}14`]
    ),
    borderColor: interpolateColor(
      completedProgress.value,
      [0, 1],
      [colors.border, `${habit.color}40`]
    ),
  }))

  return (
    <TouchableOpacity
      onPress={() => onPress?.(habit)}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          styles.card,
          { borderWidth: 1 },
          cardBgStyle,
        ]}
      >
        {/* Feedback flash al completar */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.feedbackOverlay,
            { backgroundColor: `${habit.color}20`, pointerEvents: 'none' },
            feedbackStyle,
          ]}
        />

        {/* Indicador de color */}
        <View style={[styles.colorBar, { backgroundColor: habit.color }]} />

        {/* Contenido principal */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.name,
                  {
                    color: habit.isCompleted ? colors.textSecondary : colors.text,
                    textDecorationLine: habit.isCompleted ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={1}
              >
                {habit.name}
              </Text>
              <View style={styles.categoryRow}>
                <Text style={[styles.category, { color: colors.textSecondary }]}>
                  {CATEGORY_LABELS[habit.category]}
                  {isMeasurable && targetValue
                    ? ` · ${currentValue !== null ? `${currentValue}/` : ''}${targetValue} ${habit.unit ?? (habit.type === 'timed' ? 'min' : '')}`
                    : ''}
                </Text>
                {freqLabel && (
                  <View style={[styles.freqBadge, { backgroundColor: `${habit.color}18` }]}>
                    <Text style={[styles.freqBadgeText, { color: habit.color }]}>{freqLabel}</Text>
                  </View>
                )}
              </View>
              {/* Progreso semanal para hábitos x/sem */}
              {isWeekly && weeklyProgress !== undefined && weeklyTarget !== undefined && (
                <Text style={[styles.weeklyProgress, {
                  color: habit.isCompleted ? colors.success : colors.textSecondary,
                }]}>
                  {habit.isCompleted ? '✓' : `${weeklyProgress}/${weeklyTarget}`} esta sem.
                </Text>
              )}
              {/* Barra de progreso para hábitos medibles */}
              {isMeasurable && targetValue && valueProgress !== null && (
                <View style={[styles.measurableTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.measurableFill,
                      {
                        backgroundColor: valueProgress >= 1 ? colors.success : habit.color,
                        width: `${Math.round(valueProgress * 100)}%`,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            <View style={styles.rightSection}>
              {/* Badge de riesgo de abandono */}
              {atRisk && !habit.isCompleted && (
                <View style={[styles.riskBadge, { backgroundColor: '#EF444415' }]}>
                  <Text style={[styles.riskBadgeText, { color: '#EF4444' }]}>⚠️</Text>
                </View>
              )}
              {/* Badge de días restantes (solo si quedan ≤7 días) */}
              {daysRemaining !== null && daysRemaining <= 7 && (
                <View style={[
                  styles.daysRemainingBadge,
                  {
                    backgroundColor: daysRemaining === 0
                      ? `${colors.success}20`
                      : daysRemaining <= 3
                        ? `${colors.error}15`
                        : `${colors.warning}15`,
                  },
                ]}>
                  <Text style={[
                    styles.daysRemainingText,
                    {
                      color: daysRemaining === 0
                        ? colors.success
                        : daysRemaining <= 3
                          ? colors.error
                          : colors.warning,
                    },
                  ]}>
                    {daysRemaining === 0 ? '¡Hoy!' : `${daysRemaining}d`}
                  </Text>
                </View>
              )}
              {(habit.current_streak ?? 0) >= 2 && (
                <StreakBadge streak={habit.current_streak ?? 0} compact />
              )}
              <HabitCheckbox
                checked={habit.isCompleted}
                color={habit.color}
                onPress={handleToggle}
                disabled={disabled}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    minHeight: 68,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  category: {
    fontSize: typography.sizes.xs,
    fontWeight: '400',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedbackOverlay: {
    borderRadius: radius.lg,
    zIndex: 1,
  },
  daysRemainingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  daysRemainingText: {
    fontSize: 10,
    fontWeight: '700',
  },
  measurableTrack: {
    height: 4,
    borderRadius: radius.full,
    marginTop: 5,
    overflow: 'hidden',
  },
  measurableFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  riskBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskBadgeText: {
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  freqBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freqBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  weeklyProgress: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    marginTop: 1,
  },
})
