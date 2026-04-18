import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography } from '@/constants/theme'

export default function WelcomeScreen() {
  const { colors } = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Construí mejores{'\n'}hábitos, cada día
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Seguí tu progreso, mantené tu racha y descubrí cómo tus hábitos te transforman.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { emoji: '⚡', text: 'Registro en 1 tap' },
            { emoji: '📊', text: 'Visualización clara de tu progreso' },
            { emoji: '🔥', text: 'Sistema de rachas y logros' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Empezar gratis"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
          <Button
            label="Ya tengo una cuenta"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 72,
    lineHeight: 84,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },
  actions: {
    gap: spacing.sm,
  },
})
