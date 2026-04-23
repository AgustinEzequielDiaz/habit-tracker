import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, Platform, KeyboardAvoidingView,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { HabitWithCompletion } from '@/types'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.48

interface ValueInputModalProps {
  habit: HabitWithCompletion | null
  onConfirm: (habitId: string, value: number) => void
  onSkip: (habitId: string) => void
  onClose: () => void
}

// Genera presets inteligentes basados en el target_value
function getPresets(targetValue: number | null, type: string): number[] {
  if (type === 'timed') {
    // Para hábitos de tiempo: presets en minutos
    const base = targetValue ?? 30
    return [
      Math.round(base * 0.5),
      Math.round(base * 0.75),
      base,
      Math.round(base * 1.25),
    ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
  }
  // Para hábitos medibles: presets numéricos
  const base = targetValue ?? 10
  return [
    Math.round(base * 0.5),
    Math.round(base * 0.75),
    base,
    Math.round(base * 1.5),
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
}

export function ValueInputModal({ habit, onConfirm, onSkip, onClose }: ValueInputModalProps) {
  const { colors } = useTheme()
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const [value, setValue] = useState('')
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (habit) {
      setValue('')
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => inputRef.current?.focus(), 100)
      })
    }
  }, [habit])

  const handleClose = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => { onClose(); cb?.() })
  }

  if (!habit) return null

  const presets = getPresets(habit.target_value, habit.type)
  const parsedValue = parseFloat(value.replace(',', '.'))
  const isValid = !isNaN(parsedValue) && parsedValue > 0

  const unit = habit.type === 'timed'
    ? 'min'
    : (habit.unit || '')

  const handleConfirm = () => {
    if (!isValid) return
    handleClose(() => onConfirm(habit.id, parsedValue))
  }

  const handleSkip = () => {
    handleClose(() => onSkip(habit.id))
  }

  const progress = isValid && habit.target_value
    ? Math.min(parsedValue / habit.target_value, 1)
    : 0

  return (
    <Modal
      visible={!!habit}
      transparent
      animationType="none"
      onRequestClose={() => handleClose()}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => handleClose()} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvWrapper}
        pointerEvents="box-none"
      >
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
          <View style={styles.header}>
            <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={[styles.habitSub, { color: colors.textSecondary }]}>
                {habit.type === 'timed' ? '⏱ Tiempo' : '📊 Medible'}
                {habit.target_value ? ` · Meta: ${habit.target_value} ${unit}` : ''}
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder={`${habit.target_value ?? '0'}`}
                placeholderTextColor={colors.textDisabled}
                style={[styles.valueInput, { color: colors.text }]}
                onSubmitEditing={handleConfirm}
              />
              {unit ? (
                <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>{unit}</Text>
              ) : null}
            </View>

            {/* Barra de progreso visual */}
            {habit.target_value && isValid && (
              <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: progress >= 1 ? colors.success : habit.color,
                        width: `${Math.round(progress * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: progress >= 1 ? colors.success : colors.textSecondary }]}>
                  {progress >= 1 ? '✓ Meta alcanzada' : `${Math.round(progress * 100)}% de la meta`}
                </Text>
              </View>
            )}
          </View>

          {/* Presets */}
          <View style={styles.presetsSection}>
            <Text style={[styles.presetsLabel, { color: colors.textSecondary }]}>Acceso rápido</Text>
            <View style={styles.presetsRow}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setValue(String(preset))}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: value === String(preset) ? habit.color : colors.surface,
                      borderColor: value === String(preset) ? habit.color : colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.presetText,
                    { color: value === String(preset) ? '#fff' : colors.text },
                  ]}>
                    {preset}{unit ? ` ${unit}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>Solo marcar ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isValid ? habit.color : colors.surface },
              ]}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <Text style={[
                styles.confirmText,
                { color: isValid ? '#fff' : colors.textDisabled },
              ]}>
                Guardar valor
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(28,25,23,0.55)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    minHeight: SHEET_H,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 16 },
    }),
  },
  handleWrapper: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  habitName: { fontSize: typography.sizes.lg, fontWeight: '700', letterSpacing: -0.3 },
  habitSub: { fontSize: typography.sizes.xs, marginTop: 2 },
  inputSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  valueInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
    padding: 0,
  },
  unitLabel: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  progressSection: {
    gap: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  presetsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  presetsLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  presetText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
})
