import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { CreateHabitForm, HabitCategory, HabitDifficulty, HabitType } from '@/types'
import { Button } from '@/components/ui/Button'
import { HabitSchedulePicker } from '@/components/ui/HabitSchedulePicker'
import { useTheme } from '@/hooks/useTheme'
import { spacing, radius, typography, HABIT_COLORS } from '@/constants/theme'
import { todayString } from '@/utils/date'

interface HabitFormProps {
  initial?: Partial<CreateHabitForm>
  onSubmit: (form: CreateHabitForm) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const CATEGORIES: { key: HabitCategory; label: string; emoji: string }[] = [
  { key: 'fitness',       label: 'Fitness',       emoji: '💪' },
  { key: 'productividad', label: 'Productividad',  emoji: '🎯' },
  { key: 'bienestar',     label: 'Bienestar',      emoji: '🧘' },
  { key: 'rutinas',       label: 'Rutinas',        emoji: '📋' },
]

const DIFFICULTIES: { key: HabitDifficulty; label: string; desc: string }[] = [
  { key: 'easy',   label: 'Fácil',   desc: 'Bajo esfuerzo' },
  { key: 'normal', label: 'Normal',  desc: 'Esfuerzo moderado' },
  { key: 'hard',   label: 'Difícil', desc: 'Alto esfuerzo' },
]

export function HabitForm({ initial, onSubmit, onCancel, submitLabel = 'Crear hábito' }: HabitFormProps) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? 'rutinas')
  const [type] = useState<HabitType>(initial?.type ?? 'binary')
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(initial?.difficulty ?? 'normal')
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? 'star')
  const [error, setError] = useState<string | null>(null)

  // Scheduling
  const [showSchedule, setShowSchedule] = useState(
    !!(initial?.start_date && initial.start_date !== todayString()) || !!initial?.end_date
  )
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayString())
  const [endDate, setEndDate] = useState<string | null>(initial?.end_date ?? null)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre del hábito es obligatorio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit({
        name: name.trim(),
        category,
        type,
        difficulty,
        color,
        icon,
        start_date: startDate,
        end_date: endDate,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
    fontSize: typography.sizes.md,
  }

  // Resumen del schedule para mostrar en el botón colapsable
  const scheduleSummary = (() => {
    const today = todayString()
    const parts: string[] = []
    if (startDate && startDate !== today) {
      const diffDays = Math.round(
        (new Date(startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays === 1) parts.push('Empieza mañana')
      else if (diffDays > 0) parts.push(`Empieza en ${diffDays}d`)
    }
    if (endDate) {
      const diffDays = Math.round(
        (new Date(endDate).getTime() - new Date(startDate || today).getTime()) / (1000 * 60 * 60 * 24)
      )
      parts.push(`${diffDays} días`)
    }
    return parts.length > 0 ? parts.join(' · ') : 'Sin programar'
  })()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre del hábito</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ej: Leer 20 minutos"
            placeholderTextColor={colors.textDisabled}
            style={[styles.input, inputStyle]}
            maxLength={100}
            autoFocus
          />
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: category === cat.key ? color : colors.surface,
                    borderColor: category === cat.key ? color : colors.border,
                  },
                ]}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: category === cat.key ? '#fff' : colors.text },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dificultad */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Dificultad</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.key}
                onPress={() => setDifficulty(d.key)}
                style={[
                  styles.chip,
                  styles.chipFlex,
                  {
                    backgroundColor: difficulty === d.key ? color : colors.surface,
                    borderColor: difficulty === d.key ? color : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: difficulty === d.key ? '#fff' : colors.text },
                  ]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[
                    styles.chipSub,
                    { color: difficulty === d.key ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                  ]}
                >
                  {d.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
              >
                {color === c && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Programar (colapsable) ── */}
        <View style={[styles.scheduleCard, { borderColor: showSchedule ? colors.primary : colors.border, backgroundColor: showSchedule ? `${colors.primary}06` : colors.surface }]}>
          <TouchableOpacity
            onPress={() => setShowSchedule(!showSchedule)}
            style={styles.scheduleToggleRow}
            activeOpacity={0.7}
          >
            <View style={styles.scheduleToggleLeft}>
              <Text style={styles.scheduleIcon}>🗓️</Text>
              <View>
                <Text style={[styles.scheduleToggleTitle, { color: colors.text }]}>
                  Programar
                </Text>
                <Text style={[styles.scheduleToggleSub, { color: colors.textSecondary }]}>
                  {scheduleSummary}
                </Text>
              </View>
            </View>
            <Text style={[styles.scheduleChevron, { color: colors.textSecondary }]}>
              {showSchedule ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showSchedule && (
            <View style={[styles.schedulePicker, { borderTopColor: colors.border }]}>
              <HabitSchedulePicker
                startDate={startDate}
                endDate={endDate}
                onChangeStart={setStartDate}
                onChangeEnd={setEndDate}
              />
            </View>
          )}
        </View>

        {/* Error */}
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={onCancel}
            style={styles.actionBtn}
          />
          <Button
            label={submitLabel}
            variant="primary"
            onPress={handleSubmit}
            loading={loading}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontWeight: '400',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipFlex: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  chipSub: {
    fontSize: typography.sizes.xs,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  colorCheck: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  // ── Programar ──
  scheduleCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  scheduleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  scheduleToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleIcon: {
    fontSize: 20,
  },
  scheduleToggleTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  scheduleToggleSub: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  scheduleChevron: {
    fontSize: 12,
    fontWeight: '700',
  },
  schedulePicker: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
  // ──
  error: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
})
