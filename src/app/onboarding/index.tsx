import React, { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { HabitForm } from '@/components/habits/HabitForm'
import { Button } from '@/components/ui/Button'
import { useHabitsStore } from '@/stores/habits.store'
import { useUserStore } from '@/stores/user.store'
import { notificationsService } from '@/services/notifications.service'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { CreateHabitForm } from '@/types'

type Step = 'welcome' | 'habit' | 'notifications'

export default function OnboardingScreen() {
  const { colors } = useTheme()
  const [step, setStep] = useState<Step>('welcome')
  const { addHabit } = useHabitsStore()
  const { updateUser } = useUserStore()

  const handleHabitCreate = async (form: CreateHabitForm) => {
    await addHabit(form)
    setStep('notifications')
  }

  const handleNotifications = async (enable: boolean) => {
    if (enable) {
      const token = await notificationsService.registerForPushNotifications()
      if (token) await notificationsService.savePushToken(token)
    }
    await finishOnboarding()
  }

  const finishOnboarding = async () => {
    await updateUser({ onboarding_complete: true })
    router.replace('/(main)/today')
  }

  // ─────────────────────────────────────────
  // Paso 1: Bienvenida
  // ─────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.stepContent}>
          {/* Progress dots */}
          <View style={styles.dots}>
            {(['welcome', 'habit', 'notifications'] as Step[]).map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor: s === step ? colors.primary : colors.border,
                    width: s === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>👋</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              ¡Bienvenido!
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Vamos a configurar tu primera rutina.{'\n'}
              Solo necesitás 2 pasos más.
            </Text>
          </View>

          <Button
            label="Crear mi primer hábito"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => setStep('habit')}
          />
        </View>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────
  // Paso 2: Crear primer hábito
  // ─────────────────────────────────────────
  if (step === 'habit') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.stepHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.dots}>
            {(['welcome', 'habit', 'notifications'] as Step[]).map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor: s === step ? colors.primary : s === 'welcome' ? colors.secondary : colors.border,
                    width: s === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Tu primer hábito</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
            Empezá simple. Podés agregar más después.
          </Text>
        </View>
        <HabitForm
          onSubmit={handleHabitCreate}
          onCancel={() => setStep('welcome')}
          submitLabel="Agregar hábito"
        />
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────
  // Paso 3: Notificaciones
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <View style={styles.dots}>
          {(['welcome', 'habit', 'notifications'] as Step[]).map((s) => (
            <View
              key={s}
              style={[
                styles.dot,
                {
                  backgroundColor: s !== 'notifications' ? colors.secondary : colors.primary,
                  width: s === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🔔</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Recordatorios{'\n'}inteligentes
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Te avisamos solo cuando tiene sentido.{'\n'}
            Sin spam, sin saturación.
          </Text>
        </View>

        <View style={styles.notifActions}>
          <Button
            label="Activar recordatorios"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => handleNotifications(true)}
          />
          <Button
            label="Ahora no"
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => handleNotifications(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
  },
  stepHeader: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  heroEmoji: { fontSize: 72, lineHeight: 84 },
  heroTitle: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: typography.sizes.md,
  },
  notifActions: { gap: spacing.sm },
})
