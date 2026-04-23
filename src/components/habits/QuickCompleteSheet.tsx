import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, ScrollView, Platform,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { HabitWithCompletion } from '@/types'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.68

interface QuickCompleteSheetProps {
  visible: boolean
  habits: HabitWithCompletion[]
  onToggle: (habitId: string) => void
  onClose: () => void
}

function HabitRow({
  habit,
  onToggle,
}: {
  habit: HabitWithCompletion
  onToggle: (id: string) => void
}) {
  const { colors } = useTheme()
  const checkAnim = useRef(new Animated.Value(habit.isCompleted ? 1 : 0)).current

  const handlePress = () => {
    if (habit.isCompleted) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Animated.spring(checkAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 180,
    }).start()
    onToggle(habit.id)
  }

  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] })

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={habit.isCompleted ? 1 : 0.75}
      style={[
        styles.habitRow,
        {
          backgroundColor: habit.isCompleted
            ? `${colors.success}10`
            : colors.surface,
          borderColor: habit.isCompleted
            ? `${colors.success}30`
            : colors.border,
        },
      ]}
    >
      {/* Color dot */}
      <View style={[styles.colorDot, { backgroundColor: habit.color }]} />

      {/* Name */}
      <Text
        style={[
          styles.habitName,
          {
            color: habit.isCompleted ? colors.textSecondary : colors.text,
            textDecorationLine: habit.isCompleted ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={1}
      >
        {habit.name}
      </Text>

      {/* Streak pill */}
      {(habit.current_streak ?? 0) > 0 && (
        <Text style={[styles.streakPill, { color: colors.streak }]}>
          🔥{habit.current_streak}
        </Text>
      )}

      {/* Check */}
      <Animated.View
        style={[
          styles.checkCircle,
          {
            backgroundColor: habit.isCompleted ? colors.success : 'transparent',
            borderColor: habit.isCompleted ? colors.success : colors.border,
            transform: [{ scale: checkScale }],
          },
        ]}
      >
        {habit.isCompleted && (
          <Text style={styles.checkMark}>✓</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

export function QuickCompleteSheet({
  visible,
  habits,
  onToggle,
  onClose,
}: QuickCompleteSheetProps) {
  const { colors } = useTheme()
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const pendingHabits = habits.filter((h) => !h.isCompleted)
  const completedHabits = habits.filter((h) => h.isCompleted)
  const allDone = pendingHabits.length === 0 && habits.length > 0

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  // Auto-close with celebration when all done
  useEffect(() => {
    if (visible && allDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const timer = setTimeout(() => handleClose(), 1400)
      return () => clearTimeout(timer)
    }
  }, [allDone, visible])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_H,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose())
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleWrapper}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {allDone ? '🎉 ¡Todo listo!' : '⚡ Completar hábitos'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {allDone
                ? 'Completaste todos tus hábitos de hoy'
                : `${pendingHabits.length} pendiente${pendingHabits.length !== 1 ? 's' : ''} · ${completedHabits.length} hecho${completedHabits.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* All done state */}
        {allDone ? (
          <View style={styles.allDoneContainer}>
            <Text style={styles.allDoneEmoji}>⭐</Text>
            <Text style={[styles.allDoneText, { color: colors.text }]}>
              Día perfecto en camino
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {/* Pending first */}
            {pendingHabits.map((h) => (
              <HabitRow key={h.id} habit={h} onToggle={onToggle} />
            ))}

            {/* Divider when both sections present */}
            {pendingHabits.length > 0 && completedHabits.length > 0 && (
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            )}

            {/* Already done */}
            {completedHabits.map((h) => (
              <HabitRow key={h.id} habit={h} onToggle={onToggle} />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(28,25,23,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  handleWrapper: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 56,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  habitName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  streakPill: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  allDoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  allDoneEmoji: { fontSize: 56 },
  allDoneText: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
})
