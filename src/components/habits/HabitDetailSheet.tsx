import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, ScrollView, Platform, TextInput,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { HabitWithCompletion, HabitCompletion } from '@/types'
import { getLast30Days, formatShortDate } from '@/utils/date'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.72

interface HabitDetailSheetProps {
  habit: HabitWithCompletion | null
  recentCompletions: HabitCompletion[]
  onClose: () => void
  onToggle: (habitId: string) => void
  onAddNote?: (habitId: string, note: string) => void
}

const CATEGORY_LABELS = {
  fitness:       '💪 Fitness',
  productividad: '🎯 Productividad',
  bienestar:     '🧘 Bienestar',
  rutinas:       '📋 Rutinas',
}

const DIFFICULTY_LABELS = {
  easy:   { label: 'Fácil',   emoji: '🟢' },
  normal: { label: 'Normal',  emoji: '🟡' },
  hard:   { label: 'Difícil', emoji: '🔴' },
}

// ── Mini calendario de los últimos 30 días ──────────────────────────
function MiniCalendar({ completedDates, color }: { completedDates: Set<string>; color: string }) {
  const { colors } = useTheme()
  const last30 = getLast30Days()
  const COLS = 7
  const rows: string[][] = []

  // Agrupar en filas de 7 (semanas)
  for (let i = 0; i < last30.length; i += COLS) {
    rows.push(last30.slice(i, i + COLS))
  }

  const doneCount = last30.filter((d) => completedDates.has(d)).length
  const rate = Math.round((doneCount / last30.length) * 100)

  return (
    <View style={calStyles.container}>
      <View style={calStyles.header}>
        <Text style={[calStyles.title, { color: colors.textSecondary }]}>Últimos 30 días</Text>
        <Text style={[calStyles.rate, { color: doneCount > 20 ? colors.success : doneCount > 10 ? colors.warning : colors.error }]}>
          {doneCount}/30 · {rate}%
        </Text>
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((date) => {
            const done = completedDates.has(date)
            return (
              <View
                key={date}
                style={[
                  calStyles.dot,
                  {
                    backgroundColor: done ? color : colors.surface,
                    borderColor: done ? color : colors.border,
                  },
                ]}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}

const calStyles = StyleSheet.create({
  container: { gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: typography.sizes.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  rate: { fontSize: typography.sizes.sm, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 5 },
  dot: { width: 34, height: 34, borderRadius: 8, borderWidth: 1 },
})

// ── Sheet principal ──────────────────────────────────────────────────
export function HabitDetailSheet({ habit, recentCompletions, onClose, onToggle, onAddNote }: HabitDetailSheetProps) {
  const { colors, isDark } = useTheme()
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    if (habit) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [habit])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  if (!habit) return null

  const habitCompletions = recentCompletions.filter((c) => c.habit_id === habit.id)
  const completedDates = new Set(habitCompletions.map((c) => c.completed_date))
  const diff = DIFFICULTY_LABELS[habit.difficulty]
  const streak = habit.current_streak ?? 0

  return (
    <Modal
      visible={!!habit}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Color bar + nombre */}
          <View style={styles.nameRow}>
            <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={2}>
                {habit.name}
              </Text>
              <Text style={[styles.habitMeta, { color: colors.textSecondary }]}>
                {CATEGORY_LABELS[habit.category]}
                {' · '}{diff.emoji} {diff.label}
              </Text>
            </View>

            {/* Badge completado hoy */}
            <View style={[
              styles.todayBadge,
              { backgroundColor: habit.isCompleted ? `${colors.success}20` : `${colors.warning}15` },
            ]}>
              <Text style={[styles.todayBadgeText, { color: habit.isCompleted ? colors.success : colors.warning }]}>
                {habit.isCompleted ? '✓ Hecho' : '○ Pendiente'}
              </Text>
            </View>
          </View>

          {/* Stats rápidas */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statVal, { color: colors.streak }]}>🔥 {streak}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Racha actual</Text>
            </View>
            {habit.current_streak !== undefined && (
              <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{habitCompletions.length}</Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>completiones</Text>
              </View>
            )}
            {habit.end_date && (
              <View style={[styles.statPill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {Math.max(0, Math.round((new Date(habit.end_date).getTime() - Date.now()) / 86400000))}d
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>restantes</Text>
              </View>
            )}
          </View>

          {/* Mini calendario 30 días */}
          <MiniCalendar completedDates={completedDates} color={habit.color} />

          {/* Descripción (si tiene) */}
          {habit.description ? (
            <View style={[styles.descBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{habit.description}</Text>
            </View>
          ) : null}

          {/* Nota de hoy (si el hábito está completado o si hay callback para agregar nota) */}
          {habit.isCompleted && onAddNote && (
            <View style={[styles.noteSection, { borderColor: colors.border }]}>
              <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
                📝 Nota para hoy
              </Text>
              <TextInput
                value={noteText}
                onChangeText={(t) => { setNoteText(t); setNoteSaved(false) }}
                placeholder="¿Cómo fue? ¿Algo que destacar?"
                placeholderTextColor={colors.textDisabled}
                multiline
                style={[
                  styles.noteInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                textAlignVertical="top"
                maxLength={200}
              />
              {noteText.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    onAddNote(habit.id, noteText.trim())
                    setNoteSaved(true)
                  }}
                  style={[styles.saveNoteBtn, { backgroundColor: `${colors.primary}14` }]}
                >
                  <Text style={[styles.saveNoteBtnText, { color: noteSaved ? colors.success : colors.primary }]}>
                    {noteSaved ? '✓ Guardado' : 'Guardar nota'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Nota existente en la completion de hoy */}
          {habit.isCompleted && habit.completion?.note && !onAddNote && (
            <View style={[styles.existingNote, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
              <Text style={[styles.existingNoteText, { color: colors.textSecondary }]}>
                📝 {habit.completion.note}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer — acción principal */}
        <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: habit.isCompleted ? `${colors.error}15` : habit.color }]}
            onPress={() => { onToggle(habit.id); handleClose() }}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleBtnText, { color: habit.isCompleted ? colors.error : '#fff' }]}>
              {habit.isCompleted ? '✕  Desmarcar hoy' : '✓  Marcar como hecho'}
            </Text>
          </TouchableOpacity>
        </View>
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handleWrapper: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  habitName: { fontSize: typography.sizes.xl, fontWeight: '700', letterSpacing: -0.3, lineHeight: 26 },
  habitMeta: { fontSize: typography.sizes.sm, marginTop: 3 },
  todayBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  todayBadgeText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, gap: 2 },
  statVal: { fontSize: typography.sizes.lg, fontWeight: '800' },
  statLbl: { fontSize: 10, fontWeight: '500' },
  descBox: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  descText: { fontSize: typography.sizes.sm, lineHeight: 20 },
  noteSection: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  noteLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    minHeight: 60,
  },
  saveNoteBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  saveNoteBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  existingNote: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  existingNoteText: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  toggleBtnText: { fontSize: typography.sizes.md, fontWeight: '700' },
})
