import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'
import { LEVEL_NAMES } from '@/constants/achievements'

interface XPProgressBarProps {
  level: number
  levelProgress: number   // 0-1
  xpToNextLevel: number
  totalXp: number
  compact?: boolean
}

export function XPProgressBar({
  level,
  levelProgress,
  xpToNextLevel,
  totalXp,
  compact = false,
}: XPProgressBarProps) {
  const { colors } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(levelProgress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    })
  }, [levelProgress])

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.track, { backgroundColor: colors.surface, height: 4 }]}>
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: colors.xpBar, borderRadius: radius.full, height: 4 },
              barStyle,
            ]}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.levelText, { color: colors.text }]}>
            Nivel {level}
          </Text>
          <Text style={[styles.levelName, { color: colors.textSecondary }]}>
            {LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}
          </Text>
        </View>
        <Text style={[styles.xpText, { color: colors.xpBar }]}>
          {xpToNextLevel > 0 ? `${xpToNextLevel} XP para el siguiente` : '¡Nivel máximo!'}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surface }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: colors.xpBar, borderRadius: radius.full },
            barStyle,
          ]}
        />
      </View>

      <Text style={[styles.totalXp, { color: colors.textSecondary }]}>
        {totalXp.toLocaleString()} XP total
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  compactContainer: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  levelText: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  levelName: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  xpText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  totalXp: {
    fontSize: typography.sizes.xs,
    textAlign: 'right',
  },
})
