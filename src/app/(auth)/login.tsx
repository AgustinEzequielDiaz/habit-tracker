import React, { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'

export default function LoginScreen() {
  const { colors } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Completá todos los campos')
      return
    }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (authError) setError(authError.message)
    // El redirect lo maneja el listener en _layout.tsx
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const inputStyle = {
    backgroundColor: colors.surface,
    color: colors.text,
    borderColor: colors.border,
    fontSize: typography.sizes.md,
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← Volver</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Iniciar sesión</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[styles.input, inputStyle]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              autoComplete="current-password"
              style={[styles.input, inputStyle]}
            />

            {error && (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}

            <Button
              label="Ingresar"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleLogin}
              loading={loading}
            />

            <View style={[styles.divider]}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Button
              label="Continuar con Google"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={handleGoogleLogin}
            />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              ¿No tenés cuenta?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
    flexGrow: 1,
  },
  header: { gap: spacing.lg },
  backBtn: { fontSize: typography.sizes.md, fontWeight: '600' },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  form: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  error: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: typography.sizes.sm },
  switchText: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
})
