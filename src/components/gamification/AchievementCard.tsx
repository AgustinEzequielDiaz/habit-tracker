import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { AchievementDefinition } from '@/types'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'

interface AchievementCardProps {
  achievement: AchievementDefinition
  unlocked: boolean
  unlockedAt?: string
}

export function AchievementCard({ achievement, unlocked, unlockedAt }: AchievementCardProps) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: unlocked ? `${colors.primary}50` : colors.border,
          borderWidth: 1,
          opacity: unlocked ? 1 : 0.45,
        },
      ]}
    >
      <Text style={[styles.icon, !unlocked && styles.lockedIcon]}>
        {unlocked ? achievement.icon : '🔒'}
      </Text>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]}>{achievement.name}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {achievement.description}
        </Text>
        {unlocked && unlockedAt && (
          <Text style={[styles.date, { color: colors.primary }]}>
            +{achievement.xp} XP
          </Text>
        )}
        {!unlocked && (
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            +{achievement.xp} XP al desbloquear
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  icon: {
    fontSize: 32,
    width: 44,
    textAlign: 'center',
  },
  lockedIcon: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.sizes.sm,
  },
  date: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
})
