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
}
