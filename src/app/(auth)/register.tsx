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

export default function RegisterScreen() {
  const { colors } = useTheme()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Completá todos los campos')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: displayName.trim() },
      },
    })

    setLoading(false)
    if (authError) setError(authError.message)
    // El redirect lo maneja el listener en _layout.tsx
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backBtn, { color: colors.primary }]}>← Volver</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Gratis, sin tarjeta.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="words"
              autoComplete="name"
              style={[styles.input, inputStyle]}
            />
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
              placeholder="Contraseña (mínimo 8 caracteres)"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              autoComplete="new-password"
              style={[styles.input, inputStyle]}
            />

            {error && (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}

            <Button
              label="Crear cuenta"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              ¿Ya tenés cuenta?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.sm },
  backBtn: { fontSize: typography.sizes.md, fontWeight: '600' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: typography.sizes.md },
  form: { gap: spacing.md },
  input: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  error: { fontSize: typography.sizes.sm, textAlign: 'center' },
  switchText: { textAlign: 'center', fontSize: typography.sizes.sm, marginTop: spacing.md },
})
