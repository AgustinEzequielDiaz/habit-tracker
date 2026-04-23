import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, Switch, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/hooks/useTheme'
import { useUserStore } from '@/stores/user.store'
import { useSettingsStore, FabAction } from '@/stores/settings.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { spacing, typography, radius, AVATAR_EMOJIS, ACCENT_COLORS } from '@/constants/theme'
import { notificationsService } from '@/services/notifications.service'

// ─────────────────────────────────────────
// Sección del settings
// ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={sectionStyles.container}>
      <Text style={[sectionStyles.title, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
      <Card padding={0} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  container: { gap: 6 },
  title: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, paddingHorizontal: 4 },
})

// ─────────────────────────────────────────
// Fila del settings
// ─────────────────────────────────────────
function SettingsRow({
  label, value, onPress, rightElement, showArrow = true, last = false,
}: {
  label: string
  value?: string
  onPress?: () => void
  rightElement?: React.ReactNode
  showArrow?: boolean
  last?: boolean
}) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[
        rowStyles.row,
        { borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
      ]}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        {rightElement ?? (
          <View style={rowStyles.right}>
            {value && <Text style={[rowStyles.value, { color: colors.textSecondary }]}>{value}</Text>}
            {showArrow && onPress && <Text style={{ color: colors.textSecondary, fontSize: 16 }}>›</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  label: { fontSize: typography.sizes.md, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: typography.sizes.sm },
})

// ─────────────────────────────────────────
// Modal de emoji picker
// ─────────────────────────────────────────
function EmojiPicker({ selected, onSelect }: { selected: string | null; onSelect: (e: string) => void }) {
  const { colors } = useTheme()
  return (
    <View style={emojiStyles.grid}>
      {AVATAR_EMOJIS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={[
            emojiStyles.cell,
            { backgroundColor: selected === emoji ? `${colors.primary}20` : 'transparent',
              borderColor: selected === emoji ? colors.primary : 'transparent',
              borderWidth: 2 },
          ]}
        >
          <Text style={emojiStyles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const emojiStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: spacing.md },
  cell: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
})

// ─────────────────────────────────────────
// Selector de color de acento
// ─────────────────────────────────────────
function AccentColorPicker({ selected, onSelect }: { selected: string | null; onSelect: (n: string) => void }) {
  const { colors } = useTheme()
  return (
    <View style={colorStyles.grid}>
      {ACCENT_COLORS.map((c) => (
        <TouchableOpacity
          key={c.name}
          onPress={() => onSelect(c.name)}
          style={colorStyles.cell}
        >
          <View style={[
            colorStyles.swatch,
            { backgroundColor: c.light },
            selected === c.name && colorStyles.swatchSelected,
          ]}>
            {selected === c.name && <Text style={colorStyles.check}>✓</Text>}
          </View>
          <Text style={[colorStyles.label, { color: colors.textSecondary }]}>{c.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const colorStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingVertical: spacing.md },
  cell: { alignItems: 'center', gap: 4, width: 64 },
  swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { transform: [{ scale: 1.15 }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  check: { color: '#fff', fontWeight: '800', fontSize: 18 },
  label: { fontSize: 10, fontWeight: '500' },
})

// ─────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────
export default function SettingsScreen() {
  const { colors } = useTheme()
  const { user, updateUser } = useUserStore()
  const { accentColorName, avatarEmoji, notificationTime, fabAction, setAccentColor, setAvatarEmoji, setFabAction, resetToDefaults } = useSettingsStore()

  const { recentCompletions, loadRecentCompletions } = useCompletionsStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.display_name ?? '')
  const [savingName, setSavingName] = useState(false)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [smartTime, setSmartTime] = useState<string | null>(null)
  const [analyzingTime, setAnalyzingTime] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)

  useEffect(() => {
    loadRecentCompletions()
  }, [])

  const handleAnalyzeTime = async () => {
    setAnalyzingTime(true)
    const suggested = notificationsService.analyzeOptimalTime(recentCompletions)
    setAnalyzingTime(false)
    if (suggested) {
      setSmartTime(suggested)
      Alert.alert(
        '⏰ Horario sugerido',
        `Basado en tu historial, solés completar tus hábitos alrededor de las ${suggested}.\n¿Querés usar este horario para los recordatorios?`,
        [
          { text: 'No por ahora', style: 'cancel' },
          {
            text: 'Usar este horario',
            onPress: async () => {
              await useSettingsStore.getState().setNotificationTime(suggested)
              await notificationsService.scheduleDailyReminder(suggested, user?.display_name ?? undefined)
              Alert.alert('✓', `Recordatorio diario configurado para las ${suggested}`)
            },
          },
        ]
      )
    } else {
      Alert.alert('Pocos datos', 'Necesitás al menos 5 completions para analizar tu horario óptimo.')
    }
  }

  const handleSaveName = async () => {
    if (!nameInput.trim()) return
    setSavingName(true)
    try {
      await updateUser({ display_name: nameInput.trim() })
      setEditingName(false)
    } catch {
      Alert.alert('Error', 'No se pudo guardar el nombre.')
    } finally {
      setSavingName(false)
    }
  }

  const handleSelectEmoji = async (emoji: string) => {
    await setAvatarEmoji(emoji)
    // Sincronizar con Supabase (avatar_url = emoji string)
    try { await updateUser({ avatar_url: emoji }) } catch {}
    setShowEmojiPicker(false)
  }

  const handleSelectAccentColor = async (name: string) => {
    await setAccentColor(name)
    setShowColorPicker(false)
  }

  const handleReset = () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Restablecer todas las preferencias a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: () => resetToDefaults() },
      ]
    )
  }

  const currentAvatar = avatarEmoji ?? user?.avatar_url ?? null
  const appVersion = '4.1.0'

  const FAB_OPTIONS: { action: FabAction; emoji: string; label: string; desc: string }[] = [
    { action: 'quick_complete', emoji: '⚡', label: 'Completar hábitos', desc: 'Abre la lista de hábitos pendientes' },
    { action: 'new_habit',      emoji: '➕', label: 'Nuevo hábito',       desc: 'Ir a la pantalla de hábitos' },
    { action: 'log_mood',       emoji: '😊', label: 'Registrar mood',     desc: 'Ir a Hoy para registrar tu estado' },
    { action: 'write_note',     emoji: '📓', label: 'Escribir nota',      desc: 'Abre el journal del día' },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── PERFIL ── */}
        <Section title="Mi Perfil">
          {/* Avatar */}
          <SettingsRow
            label="Avatar"
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            rightElement={
              <View style={styles.avatarRight}>
                <Text style={{ fontSize: 28 }}>{currentAvatar ?? '👤'}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>›</Text>
              </View>
            }
          />
          {showEmojiPicker && (
            <View style={[styles.pickerContainer, { borderTopColor: colors.divider }]}>
              <EmojiPicker selected={currentAvatar} onSelect={handleSelectEmoji} />
            </View>
          )}

          {/* Nombre */}
          {editingName ? (
            <View style={[styles.nameEditRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider }]}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                style={[styles.nameInput, { color: colors.text, borderColor: colors.primary }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                placeholderTextColor={colors.textDisabled}
                placeholder="Tu nombre"
                maxLength={30}
              />
              <View style={styles.nameActions}>
                <TouchableOpacity onPress={() => setEditingName(false)} style={styles.cancelBtn}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                  {savingName
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <SettingsRow
              label="Nombre"
              value={user?.display_name ?? '—'}
              onPress={() => { setNameInput(user?.display_name ?? ''); setEditingName(true) }}
            />
          )}

          <SettingsRow
            label="Email"
            value={user?.username ?? '—'}
            showArrow={false}
            last
          />
        </Section>

        {/* ── APARIENCIA ── */}
        <Section title="Apariencia">
          <SettingsRow
            label="Color de acento"
            value={accentColorName ?? 'Violet (por defecto)'}
            onPress={() => setShowColorPicker(!showColorPicker)}
          />
          {showColorPicker && (
            <View style={[styles.pickerContainer, { borderTopColor: colors.divider }]}>
              <AccentColorPicker
                selected={accentColorName}
                onSelect={handleSelectAccentColor}
              />
              {accentColorName && (
                <TouchableOpacity onPress={() => handleSelectAccentColor('Violet')}>
                  <Text style={[styles.resetAccent, { color: colors.textSecondary }]}>
                    Restablecer al violet por defecto
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <SettingsRow
            label="Tema"
            value="Sigue al sistema"
            showArrow={false}
            last
          />
        </Section>

        {/* ── NOTIFICACIONES ── */}
        <Section title="Notificaciones">
          <SettingsRow
            label="Recordatorios"
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ true: colors.primary }}
                thumbColor="#fff"
              />
            }
            showArrow={false}
          />
          <SettingsRow
            label="Horario actual"
            value={notificationTime}
            showArrow={false}
          />
          <SettingsRow
            label="Detectar horario óptimo"
            rightElement={
              analyzingTime
                ? <ActivityIndicator size="small" color={colors.primary} />
                : (
                  <TouchableOpacity
                    onPress={handleAnalyzeTime}
                    style={[smartTimeStyles.btn, { backgroundColor: `${colors.primary}15` }]}
                  >
                    <Text style={[smartTimeStyles.btnText, { color: colors.primary }]}>
                      Analizar 🧠
                    </Text>
                  </TouchableOpacity>
                )
            }
            showArrow={false}
          />
          {smartTime && (
            <View style={[smartTimeStyles.badge, { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}30` }]}>
              <Text style={[smartTimeStyles.badgeText, { color: colors.success }]}>
                ✨ Horario aprendido: {smartTime} — basado en tu historial
              </Text>
            </View>
          )}
          <SettingsRow
            label="Anti-fatiga de notificaciones"
            value="Activo"
            showArrow={false}
            last
          />
        </Section>

        {/* ── BOTÓN FLOTANTE ── */}
        <Section title="Botón flotante (FAB)">
          {FAB_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.action}
              onPress={() => setFabAction(opt.action)}
              activeOpacity={0.7}
            >
              <View style={[
                fabStyles.row,
                {
                  borderBottomWidth: i < FAB_OPTIONS.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.divider,
                  backgroundColor: fabAction === opt.action ? `${colors.primary}08` : 'transparent',
                },
              ]}>
                <Text style={fabStyles.fabEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[fabStyles.fabLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[fabStyles.fabDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                </View>
                {fabAction === opt.action && (
                  <View style={[fabStyles.selectedDot, { backgroundColor: colors.primary }]}>
                    <Text style={fabStyles.selectedCheck}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        {/* ── ACERCA DE ── */}
        <Section title="Acerca de">
          <SettingsRow label="Versión" value={appVersion} showArrow={false} />
          <SettingsRow
            label="Restablecer configuración"
            onPress={handleReset}
            rightElement={<Text style={{ color: colors.error, fontSize: 14 }}>Restablecer</Text>}
            showArrow={false}
            last
          />
        </Section>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  backBtn: { fontSize: typography.sizes.md, fontWeight: '600' },
  title: { fontSize: typography.sizes.xxl, fontWeight: '800', letterSpacing: -0.5 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  avatarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerContainer: {
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nameEditRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  nameInput: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },
  nameActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  resetAccent: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingBottom: spacing.md,
    textDecorationLine: 'underline',
  },
})

const fabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 60,
  },
  fabEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  fabLabel: { fontSize: typography.sizes.md, fontWeight: '600' },
  fabDesc: { fontSize: typography.sizes.xs, marginTop: 2 },
  selectedDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: { color: '#fff', fontSize: 13, fontWeight: '800' },
})

const smartTimeStyles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  btnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  badge: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
})
