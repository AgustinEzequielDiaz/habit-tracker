import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { todayString, addDays, formatShortDate } from '@/utils/date'

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades locales
// ─────────────────────────────────────────────────────────────────────────────

function dateFromOffset(offsetDays: number): string {
  return addDays(todayString(), offsetDays)
}

function labelFromOffset(offsetDays: number): string {
  if (offsetDays === 0) return 'Hoy'
  if (offsetDays === 1) return 'Mañana'
  return `En ${offsetDays} días`
}

// ─────────────────────────────────────────────────────────────────────────────

interface HabitSchedulePickerProps {
  startDate: string        // YYYY-MM-DD
  endDate: string | null   // YYYY-MM-DD | null
  onChangeStart: (date: string) => void
  onChangeEnd: (date: string | null) => void
}

type StartPreset = 0 | 1 | 7 | 14 | 'custom'
type DurationPreset = 7 | 21 | 30 | 66 | 90 | 'custom'

const START_PRESETS: { value: StartPreset; label: string }[] = [
  { value: 0,        label: 'Hoy' },
  { value: 1,        label: 'Mañana' },
  { value: 7,        label: '+7 días' },
  { value: 14,       label: '+14 días' },
  { value: 'custom', label: 'Elegir' },
]

const DURATION_PRESETS: { value: DurationPreset; label: string; desc: string }[] = [
  { value: 7,        label: '7d',  desc: 'Semana' },
  { value: 21,       label: '21d', desc: '3 semanas' },
  { value: 30,       label: '30d', desc: 'Un mes' },
  { value: 66,       label: '66d', desc: 'Hábito' },
  { value: 90,       label: '90d', desc: '3 meses' },
  { value: 'custom', label: '···', desc: 'Elegir' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Stepper: < N días >
// ─────────────────────────────────────────────────────────────────────────────

interface StepperProps {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  suffix?: string
}

function Stepper({ value, min = 0, max = 365, onChange, suffix = 'días' }: StepperProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepperBtnText, { color: colors.text }]}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.stepperValue, { color: colors.text }]}>
        {value} {suffix}
      </Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export function HabitSchedulePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
}: HabitSchedulePickerProps) {
  const { colors } = useTheme()
  const today = todayString()

  // Detectar qué preset está activo para start
  const startOffsetDays = (() => {
    // días desde hoy hasta startDate
    if (!startDate || startDate === today) return 0
    const diff = Math.round(
      (new Date(startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, diff)
  })()

  const activeStartPreset: StartPreset = (() => {
    if (startOffsetDays === 0) return 0
    if (startOffsetDays === 1) return 1
    if (startOffsetDays === 7) return 7
    if (startOffsetDays === 14) return 14
    return 'custom'
  })()

  const [customStartDays, setCustomStartDays] = useState(
    activeStartPreset === 'custom' ? startOffsetDays : 2
  )

  // Duración en días (si hay end_date)
  const hasEndDate = endDate !== null
  const durationDays = (() => {
    if (!endDate) return 30
    const start = new Date(startDate || today)
    const end   = new Date(endDate)
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  })()

  const activeDurationPreset: DurationPreset = (() => {
    if ([7, 21, 30, 66, 90].includes(durationDays)) return durationDays as DurationPreset
    return 'custom'
  })()

  const [customDurationDays, setCustomDurationDays] = useState(
    activeDurationPreset === 'custom' ? durationDays : 45
  )

  // ── handlers ──

  const handleStartPreset = (preset: StartPreset) => {
    if (preset === 'custom') {
      onChangeStart(dateFromOffset(customStartDays))
    } else {
      onChangeStart(dateFromOffset(preset))
      // Si hay end_date, re-calcular para mantener la duración relativa
      if (endDate && durationDays > 0) {
        onChangeEnd(addDays(dateFromOffset(preset), durationDays))
      }
    }
  }

  const handleCustomStartChange = (days: number) => {
    setCustomStartDays(days)
    onChangeStart(dateFromOffset(days))
    if (endDate && durationDays > 0) {
      onChangeEnd(addDays(dateFromOffset(days), durationDays))
    }
  }

  const handleToggleEndDate = (enabled: boolean) => {
    if (enabled) {
      // Activar con duración por defecto de 30 días
      onChangeEnd(addDays(startDate || today, 30))
    } else {
      onChangeEnd(null)
    }
  }

  const handleDurationPreset = (preset: DurationPreset) => {
    if (preset === 'custom') {
      onChangeEnd(addDays(startDate || today, customDurationDays))
    } else {
      onChangeEnd(addDays(startDate || today, preset))
    }
  }

  const handleCustomDurationChange = (days: number) => {
    setCustomDurationDays(days)
    onChangeEnd(addDays(startDate || today, days))
  }

  // ── render ──

  const chipStyle = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active ? colors.primary : colors.surface,
      borderColor: active ? colors.primary : colors.border,
    },
  ]

  const chipTextStyle = (active: boolean) => [
    styles.chipText,
    { color: active ? '#fff' : colors.text },
  ]

  return (
    <View style={styles.container}>

      {/* ── Fecha de inicio ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📅</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Empieza</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              {startDate && startDate !== today
                ? formatShortDate(startDate)
                : 'Hoy'}
            </Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {START_PRESETS.map((p) => (
            <TouchableOpacity
              key={String(p.value)}
              onPress={() => handleStartPreset(p.value)}
              style={chipStyle(activeStartPreset === p.value)}
            >
              <Text style={chipTextStyle(activeStartPreset === p.value)}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeStartPreset === 'custom' && (
          <View style={styles.customRow}>
            <Stepper
              value={customStartDays}
              min={1}
              max={365}
              onChange={handleCustomStartChange}
            />
            <Text style={[styles.dateHint, { color: colors.textSecondary }]}>
              → {formatShortDate(dateFromOffset(customStartDays))}
            </Text>
          </View>
        )}
      </View>

      {/* ── Fecha de fin ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🏁</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fecha límite</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              {hasEndDate && endDate
                ? `Termina el ${formatShortDate(endDate)} · ${durationDays} días`
                : 'Sin fecha de fin'}
            </Text>
          </View>
          <Switch
            value={hasEndDate}
            onValueChange={handleToggleEndDate}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={hasEndDate ? colors.primary : colors.surface}
          />
        </View>

        {hasEndDate && (
          <>
            <View style={styles.chipsRow}>
              {DURATION_PRESETS.map((p) => (
                <TouchableOpacity
                  key={String(p.value)}
                  onPress={() => handleDurationPreset(p.value)}
                  style={chipStyle(activeDurationPreset === p.value)}
                >
                  <Text style={chipTextStyle(activeDurationPreset === p.value)}>{p.label}</Text>
                  <Text
                    style={[
                      styles.chipDesc,
                      { color: activeDurationPreset === p.value ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                    ]}
                  >
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeDurationPreset === 'custom' && (
              <View style={styles.customRow}>
                <Stepper
                  value={customDurationDays}
                  min={1}
                  max={730}
                  onChange={handleCustomDurationChange}
                />
                {endDate && (
                  <Text style={[styles.dateHint, { color: colors.textSecondary }]}>
                    → Termina el {formatShortDate(endDate)}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: typography.sizes.xs,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  chipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  chipDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  stepperValue: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'center',
  },
  dateHint: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
})
