import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { useJournalStore } from '@/stores/journal.store'

interface JournalCardProps {
  onPress: () => void
}

export function JournalCard({ onPress }: JournalCardProps) {
  const { colors } = useTheme()
  const { todayEntry } = useJournalStore()
  const hasContent = todayEntry.trim().length > 0

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: hasContent ? `${colors.primary}30` : colors.border,
          borderLeftColor: hasContent ? colors.primary : `${colors.primary}40`,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>{hasContent ? '📓' : '✏️'}</Text>
        <View style={{ flex: 1 }}>
          {hasContent ? (
            <>
              <Text style={[styles.labelWithContent, { color: colors.textSecondary }]}>
                Nota del día
              </Text>
              <Text style={[styles.preview, { color: colors.text }]} numberOfLines={2}>
                {todayEntry.trim()}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.emptyLabel, { color: colors.text }]}>
                Nota del día
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textDisabled }]}>
                Tocá para escribir algo de hoy →
              </Text>
            </>
          )}
        </View>
        <View style={[styles.actionBadge, { backgroundColor: `${colors.primary}12` }]}>
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {hasContent ? 'Editar' : 'Escribir'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  icon: { fontSize: 20 },
  labelWithContent: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  preview: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  emptyLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
})
