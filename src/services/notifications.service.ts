import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configurar el comportamiento de notificaciones al recibirlas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Resolver projectId para push tokens (requerido en Expo SDK 49+)
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId ??
    undefined
  )
}

export const notificationsService = {
  // ─────────────────────────────────────────
  // Solicitar permisos y obtener token
  // ─────────────────────────────────────────
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications solo funcionan en dispositivos físicos')
      return null
    }

    // Crear canal en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios de hábitos',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      return null
    }

    try {
      const projectId = getProjectId()
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
      return tokenData.data
    } catch (err) {
      // En desarrollo sin EAS projectId configurado, las push tokens no están disponibles
      // La app funciona igual — solo no habrá notificaciones remotas
      console.warn('No se pudo obtener push token:', err)
      return null
    }
  },

  // ─────────────────────────────────────────
  // Guardar token en Supabase
  // ─────────────────────────────────────────
  async savePushToken(token: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    await supabase.from('notification_prefs').upsert(
      { user_id: user.user.id, push_token: token },
      { onConflict: 'user_id' }
    )
  },

  // ─────────────────────────────────────────
  // Actualizar preferencias de notificación
  // ─────────────────────────────────────────
  async updatePrefs(prefs: {
    enabled?: boolean
    reminder_time?: string
  }): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    await supabase.from('notification_prefs').upsert(
      { user_id: user.user.id, ...prefs },
      { onConflict: 'user_id' }
    )
  },

  // ─────────────────────────────────────────
  // Registrar interacción (anti-fatiga)
  // ─────────────────────────────────────────
  async recordInteraction(): Promise<void> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    await supabase
      .from('notification_prefs')
      .update({ ignored_count: 0, last_interaction_at: new Date().toISOString() })
      .eq('user_id', user.user.id)
  },

  // ─────────────────────────────────────────
  // Cancelar todas las notificaciones locales
  // ─────────────────────────────────────────
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  },

  // ─────────────────────────────────────────
  // Analizar hora óptima basada en historial
  // Devuelve 'HH:MM' o null si hay pocos datos
  // ─────────────────────────────────────────
  analyzeOptimalTime(completions: { completed_at: string }[]): string | null {
    if (completions.length < 5) return null

    // Extraer la hora de cada completion (solo últimas 30)
    const recent = completions.slice(-30)
    const hours = recent.map((c) => {
      const d = new Date(c.completed_at)
      return d.getHours() + d.getMinutes() / 60
    })

    if (hours.length === 0) return null

    // Calcular la mediana para ser robusto ante outliers
    const sorted = [...hours].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const medianHour = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]

    // Redondear a cuartos de hora
    const h = Math.floor(medianHour)
    const m = Math.round((medianHour % 1) * 60 / 15) * 15
    const finalH = m === 60 ? h + 1 : h
    const finalM = m === 60 ? 0 : m

    const hh = String(Math.min(finalH, 23)).padStart(2, '0')
    const mm = String(finalM).padStart(2, '0')
    return `${hh}:${mm}`
  },

  // ─────────────────────────────────────────
  // Programar notificación diaria local
  // time: 'HH:MM'
  // ─────────────────────────────────────────
  async scheduleDailyReminder(time: string, displayName?: string): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()

    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return

    const messages = [
      `¡Hola${displayName ? ` ${displayName.split(' ')[0]}` : ''}! ¿Ya completaste tus hábitos de hoy? 🎯`,
      '⏰ Es un buen momento para revisar tus hábitos de hoy',
      '🌟 Cada día cuenta — ¿cómo vas con tus hábitos?',
      `💪 ${displayName ? `${displayName.split(' ')[0]}, no` : 'No'} olvides tus hábitos de hoy`,
      '🔥 Mantené tu racha activa — chequeá tus hábitos',
    ]
    const randomMsg = messages[Math.floor(Math.random() * messages.length)]

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Tracker',
        body: randomMsg,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    })
  },

  // ─────────────────────────────────────────
  // Determinar si el timing aprendido difiere
  // lo suficiente del configurado (> 30 min)
  // ─────────────────────────────────────────
  shouldUpdateTime(currentTime: string, suggestedTime: string): boolean {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const diff = Math.abs(toMinutes(currentTime) - toMinutes(suggestedTime))
    return diff > 30
  },

  // ─────────────────────────────────────────
  // Anti-fatiga: incrementar contador de ignored
  // Si ignored_count >= 3, sugerir ajuste de frecuencia
  // ─────────────────────────────────────────
  async incrementIgnoredCount(): Promise<number> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return 0

    const { data } = await supabase
      .from('notification_prefs')
      .select('ignored_count')
      .eq('user_id', user.user.id)
      .single()

    const newCount = ((data?.ignored_count ?? 0) as number) + 1
    await supabase
      .from('notification_prefs')
      .upsert({ user_id: user.user.id, ignored_count: newCount }, { onConflict: 'user_id' })

    return newCount
  },
}
