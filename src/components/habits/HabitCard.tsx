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

export function HabitCard({ habit, onToggle, onPress, disabled }: HabitCardProps) {
  const { colors, isDark } = useTheme()
  const feedbackOpacity = useSharedValue(0)

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

  const cardBg = habit.isCompleted
    ? `${habit.color}15`
    : isDark
    ? colors.card
    : colors.card

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
            { backgroundColor: `${habit.color}20` },
            feedbackStyle,
          ]}
          pointerEvents="none"
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
})
