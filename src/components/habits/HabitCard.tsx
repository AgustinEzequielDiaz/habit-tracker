import React, { useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import { HabitWithCompletion } from '@/types'
import { HabitCheckbox } from './HabitCheckbox'
import { StreakBadge } from './StreakBadge'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'
import { todayString } from '@/utils/date'

interface HabitCardProps {
  habit: HabitWithCompletion
  onToggle: (habitId: string, value?: number) => void
  onPress?: (habit: HabitWithCompletion) => void
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

export function HabitCard({ habit, onToggle, onPress, disabled }: HabitCardProps) {
  const { colors } = useTheme()
  const feedbackOpacity = useSharedValue(0)
  const daysRemaining = getDaysRemaining(habit.end_date)

  const handleToggle = useCallback(() => {
    onToggle(habit.id)

    if (!habit.isCompleted) {
      // Animación de feedback al completar
      feedbackOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 })
      )
    }
  }, [habit.id, habit.isCompleted, onToggle])

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }))

  const cardBg = habit.isCompleted ? `${habit.color}15` : colors.card

  return (
    <TouchableOpacity
      onPress={() => onPress?.(habit)}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: habit.isCompleted ? `${habit.color}40` : colors.border,
            borderWidth: 1,
          },
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
              <Text style={[styles.category, { color: colors.textSecondary }]}>
                {CATEGORY_LABELS[habit.category]}
                {habit.type !== 'binary' && habit.target_value
                  ? ` · ${habit.target_value} ${habit.unit ?? ''}`
                  : ''}
              </Text>
            </View>

            <View style={styles.rightSection}>
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
      </View>
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
})
