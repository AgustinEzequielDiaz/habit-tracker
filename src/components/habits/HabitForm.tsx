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

const HABIT_TYPES: { key: HabitType; label: string; emoji: string; desc: string }[] = [
  { key: 'binary',     label: 'Hecho / No hecho', emoji: '✅', desc: 'Completado o no' },
  { key: 'measurable', label: 'Medible',           emoji: '📊', desc: 'Cantidad o repeticiones' },
  { key: 'timed',      label: 'Por tiempo',        emoji: '⏱',  desc: 'Duración en minutos' },
]

// Unidades sugeridas por categoría
const UNIT_SUGGESTIONS: Record<string, string[]> = {
  fitness:       ['reps', 'kg', 'km', 'min', 'pasos', 'series'],
  productividad: ['páginas', 'tareas', 'pomodoros', 'min', 'horas'],
  bienestar:     ['min', 'vasos', 'horas', 'veces'],
  rutinas:       ['min', 'veces', 'páginas'],
}

export function HabitForm({ initial, onSubmit, onCancel, submitLabel = 'Crear hábito' }: HabitFormProps) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? 'rutinas')
  const [type, setType] = useState<HabitType>(initial?.type ?? 'binary')
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(initial?.difficulty ?? 'normal')
  const [targetValue, setTargetValue] = useState(initial?.target_value ? String(initial.target_value) : '')
  const [unit, setUnit] = useState(initial?.unit ?? '')
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
      const parsedTarget = targetValue ? parseFloat(targetValue.replace(',', '.')) : undefined
      await onSubmit({
        name: name.trim(),
        category,
        type,
        difficulty,
        target_value: type !== 'binary' && parsedTarget && !isNaN(parsedTarget) ? parsedTarget : undefined,
        unit: type === 'timed' ? 'min' : (type === 'measurable' && unit.trim() ? unit.trim() : undefined),
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

        {/* Tipo de hábito */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de seguimiento</Text>
          <View style={styles.typeRow}>
            {HABIT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => { setType(t.key); if (t.key === 'timed') setUnit('min') }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === t.key ? `${color}18` : colors.surface,
                    borderColor: type === t.key ? color : colors.border,
                    borderWidth: type === t.key ? 2 : 1,
                  },
                ]}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text style={[styles.typeLabel, { color: type === t.key ? color : colors.text }]}>
                  {t.label}
                </Text>
                <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meta numérica — solo para measurable/timed */}
          {type !== 'binary' && (
            <View style={styles.targetRow}>
              <View style={styles.targetInputWrapper}>
                <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Meta diaria</Text>
                <TextInput
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder={type === 'timed' ? '30' : '10'}
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="decimal-pad"
                  style={[styles.targetInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                />
              </View>
              {type === 'measurable' ? (
                <View style={styles.unitWrapper}>
                  <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Unidad</Text>
                  <TextInput
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="reps, kg, km…"
                    placeholderTextColor={colors.textDisabled}
                    style={[styles.targetInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    autoCapitalize="none"
                  />
                  {/* Sugerencias de unidad */}
                  <View style={styles.unitSuggestions}>
                    {(UNIT_SUGGESTIONS[category] ?? []).slice(0, 4).map((u) => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setUnit(u)}
                        style={[styles.unitChip, { backgroundColor: unit === u ? `${color}18` : colors.surface, borderColor: unit === u ? color : colors.border }]}
                      >
                        <Text style={[styles.unitChipText, { color: unit === u ? color : colors.textSecondary }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.unitWrapper, styles.unitFixed]}>
                  <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Unidad</Text>
                  <View style={[styles.targetInput, styles.unitFixedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.unitFixedText, { color: colors.text }]}>min</Text>
                  </View>
                </View>
              )}
            </View>
          )}
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
  // ── Tipo de hábito ──
  typeRow: {
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  typeEmoji: { fontSize: 18 },
  typeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    flex: 1,
  },
  typeDesc: {
    fontSize: typography.sizes.xs,
  },
  // ── Meta numérica ──
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  targetInputWrapper: {
    gap: 4,
    width: 90,
  },
  unitWrapper: {
    flex: 1,
    gap: 4,
  },
  unitFixed: {},
  targetLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  unitSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  unitChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  unitFixedBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitFixedText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
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
