import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user.store'
import { useHabitsStore } from '@/stores/habits.store'
import { todayString } from '@/utils/date'

/**
 * Widget de Streak Freeze.
 *
 * Muestra cuántos tokens tiene el usuario y permite usar uno para
 * proteger TODAS las rachas activas en caso de que no haya completado
 * ningún hábito hoy.
 *
 * Los tokens se ganan automáticamente en DB cada vez que streak_best
 * alcanza un múltiplo de 7 (ver migration v2_streak_freeze.sql).
 */
export function StreakFreezeWidget() {
  const { colors } = useTheme()
  const { user, setUser } = useUserStore()
  const { habits } = useHabitsStore()
  const [loading, setLoading] = useState(false)

  const tokens = user?.streak_freeze_tokens ?? 0

  // Hábitos con racha activa (streak >= 1)
  const habitsWithStreak = habits.filter((h) => (h.current_streak ?? 0) >= 1)

  const handleUseFreeze = async () => {
    if (!user || tokens === 0 || habitsWithStreak.length === 0) return

    Alert.alert(
      '¿Usar Streak Freeze?',
      `Gastás 1 token para proteger la racha de ${habitsWithStreak.length} hábito${habitsWithStreak.length > 1 ? 's' : ''} hoy. Te quedan ${tokens - 1} tokens.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Usar token 🧊',
          style: 'default',
          onPress: async () => {
            setLoading(true)
            try {
              const today = todayString()

              // Insertar freeze para cada hábito con racha activa
              const freezeRows = habitsWithStreak.map((h) => ({
                user_id: user.id,
                habit_id: h.id,
                freeze_date: today,
              }))

              const { error: freezeErr } = await supabase
                .from('streak_freezes')
                .upsert(freezeRows, { onConflict: 'user_id,habit_id,freeze_date' })

              if (freezeErr) throw freezeErr

              // Restar 1 token
              const newTokens = tokens - 1
              const { error: updateErr } = await supabase
                .from('users')
                .update({ streak_freeze_tokens: newTokens })
                .eq('id', user.id)

              if (updateErr) throw updateErr

              // Actualizar estado local
              setUser({ ...user, streak_freeze_tokens: newTokens })

              Alert.alert(
                '🧊 ¡Racha protegida!',
                `Tus rachas están a salvo por hoy. Te quedan ${newTokens} token${newTokens !== 1 ? 's' : ''}.`
              )
            } catch (err) {
              Alert.alert('Error', 'No se pudo usar el freeze. Intentá de nuevo.')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // No mostrar si no hay base de datos con el campo (tokens siempre 0 y no hay rachas)
  if (tokens === 0 && habitsWithStreak.length === 0) return null

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🧊</Text>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Streak Freeze</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Protege tu racha cuando no podés completar hábitos
            </Text>
          </View>
        </View>
      </View>

      {/* Tokens */}
      <View style={styles.tokensRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.token,
              {
                backgroundColor: i < tokens
                  ? '#60A5FA'
                  : colors.surface,
                borderColor: i < tokens ? '#3B82F6' : colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{i < tokens ? '🧊' : '○'}</Text>
          </View>
        ))}
        <Text style={[styles.tokenCount, { color: colors.textSecondary }]}>
          {tokens}/5
        </Text>
      </View>

      {/* Info de cómo ganar tokens */}
      <Text style={[styles.tip, { color: colors.textSecondary }]}>
        Ganás 1 token por cada 7 días de racha consecutiva (máx 5)
      </Text>

      {/* Botón de acción */}
      <TouchableOpacity
        onPress={handleUseFreeze}
        disabled={tokens === 0 || loading || habitsWithStreak.length === 0}
        style={[
          styles.btn,
          {
            backgroundColor: tokens > 0 && habitsWithStreak.length > 0
              ? '#3B82F6'
              : colors.surface,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.btnText,
              {
                color: tokens > 0 && habitsWithStreak.length > 0
                  ? '#fff'
                  : colors.textDisabled,
              },
            ]}
          >
            {tokens === 0
              ? 'Sin tokens disponibles'
              : habitsWithStreak.length === 0
                ? 'No hay rachas activas'
                : `Usar 1 token — proteger ${habitsWithStreak.length} racha${habitsWithStreak.length > 1 ? 's' : ''}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 24,
    lineHeight: 28,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  tokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  token: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenCount: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  tip: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  btn: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  btnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
})
