import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'

interface StreakBadgeProps {
  streak: number
  compact?: boolean
}

export function StreakBadge({ streak, compact = false }: StreakBadgeProps) {
  const { colors } = useTheme()

  if (streak < 2) return null

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        { backgroundColor: `${colors.streak}20` },
      ]}
    >
      <Text style={styles.fire}>🔥</Text>
      {!compact && (
        <Text
          style={[
            styles.count,
            { color: colors.streak, fontSize: typography.sizes.xs },
          ]}
        >
          {streak}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 2,
  },
  compact: {
    paddingHorizontal: spacing.xs,
  },
  fire: {
    fontSize: 12,
    lineHeight: 16,
  },
  count: {
    fontWeight: '700',
    lineHeight: 16,
  },
})
