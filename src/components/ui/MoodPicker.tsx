import React, { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { useMoodStore, MoodLevel } from '@/stores/mood.store'

const MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: '😫', label: 'Mal',      color: '#EF4444' },
  { level: 2, emoji: '😕', label: 'Regular',  color: '#F97316' },
  { level: 3, emoji: '😐', label: 'Normal',   color: '#EAB308' },
  { level: 4, emoji: '😊', label: 'Bien',     color: '#22C55E' },
  { level: 5, emoji: '🤩', label: 'Genial',   color: '#8B5CF6' },
]

interface MoodPickerProps {
  compact?: boolean
}

export function MoodPicker({ compact = false }: MoodPickerProps) {
  const { colors } = useTheme()
  const { todayMood, setTodayMood, loadHistory, isHydrated } = useMoodStore()

  useEffect(() => {
    if (!isHydrated) loadHistory()
  }, [])

  const selectedMood = MOODS.find((m) => m.level === todayMood)

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {todayMood ? '¿Cómo te sentís hoy?' : '¿Cómo te sentís hoy?'}
        </Text>
        {selectedMood && (
          <View style={[styles.selectedBadge, { backgroundColor: `${selectedMood.color}18` }]}>
            <Text style={[styles.selectedBadgeText, { color: selectedMood.color }]}>
              {selectedMood.emoji} {selectedMood.label}
            </Text>
          </View>
        )}
      </View>

      {/* Mood options */}
      <View style={styles.optionsRow}>
        {MOODS.map((m) => (
          <MoodOption
            key={m.level}
            mood={m}
            selected={todayMood === m.level}
            onPress={() => setTodayMood(m.level)}
            compact={compact}
          />
        ))}
      </View>
    </View>
  )
}

function MoodOption({
  mood,
  selected,
  onPress,
  compact,
}: {
  mood: typeof MOODS[0]
  selected: boolean
  onPress: () => void
  compact: boolean
}) {
  const { colors } = useTheme()
  const scaleAnim = React.useRef(new Animated.Value(selected ? 1.1 : 1)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.12 : 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 200,
    }).start()
  }, [selected])

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.optionWrapper}>
      <Animated.View
        style={[
          styles.optionBtn,
          {
            backgroundColor: selected ? `${mood.color}18` : colors.surface,
            borderColor: selected ? mood.color : colors.border,
            borderWidth: selected ? 2 : 1,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
      </Animated.View>
      {!compact && (
        <Text style={[styles.moodLabel, { color: selected ? mood.color : colors.textSecondary }]}>
          {mood.label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  selectedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  selectedBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  optionWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  optionBtn: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 58,
    maxHeight: 58,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
})
