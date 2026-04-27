/**
 * Sentry — Error Tracking & Performance Monitoring
 *
 * SETUP RÁPIDO:
 * 1. npm install (ya tiene @sentry/react-native en package.json)
 * 2. Crear proyecto en https://sentry.io → React Native
 * 3. Copiar el DSN del proyecto
 * 4. Agregar al .env:
 *      EXPO_PUBLIC_SENTRY_DSN=https://xxx@oxx.ingest.sentry.io/xxx
 * 5. La app inicializa Sentry automáticamente al arrancar.
 *
 * DOCUMENTACIÓN: https://docs.sentry.io/platforms/react-native/
 */

import Constants from 'expo-constants'

// Carga dinámica para evitar error de módulo si aún no fue instalado con npm install
// Una vez ejecutado `npm install`, el import estático funciona normalmente
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/react-native')
} catch {
  // Sentry no instalado — funciones degradan a no-op
}

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

// ─────────────────────────────────────────
// Inicialización — llamar una sola vez en el entry point
// ─────────────────────────────────────────

export function initSentry() {
  if (!Sentry) return
  if (!DSN) {
    if (__DEV__) console.warn('[sentry] EXPO_PUBLIC_SENTRY_DSN no configurado. Sentry deshabilitado.')
    return
  }

  Sentry.init({
    dsn: DSN,

    // Solo activar en producción para no saturar la quota de dev
    enabled: !__DEV__,

    // Información del release para vincular errores a versiones
    release: Constants.expoConfig?.version ?? 'unknown',

    // Tasa de muestreo de performance (0.0–1.0)
    // Arrancar con 20% y ajustar según el plan de Sentry
    tracesSampleRate: 0.2,

    // Tags globales presentes en todos los eventos
    initialScope: {
      tags: {
        app: 'habit-tracker',
        platform: 'react-native',
      },
    },

    // Silenciar errores esperados que no requieren atención
    ignoreErrors: [
      'Network request failed',       // offline — cubierto por la cola
      'AbortError',                   // cancelaciones de fetch intencionales
      'User cancelled',               // share sheet cancelado por el usuario
    ],
  })
}

// ─────────────────────────────────────────
// Identificar al usuario (llamar después del login)
// ─────────────────────────────────────────

export function identifySentryUser(userId: string, email?: string) {
  Sentry?.setUser({ id: userId, email })
}

// ─────────────────────────────────────────
// Limpiar identidad (llamar en logout)
// ─────────────────────────────────────────

export function clearSentryUser() {
  Sentry?.setUser(null)
}

// ─────────────────────────────────────────
// Capturar error con contexto adicional
// ─────────────────────────────────────────

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (__DEV__) {
    // En dev: mostrar en consola, no enviar a Sentry
    console.error('[sentry:captureError]', error, context)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry?.withScope((scope: any) => {
    if (context) scope.setContext('extra', context)
    Sentry?.captureException(error)
  })
}

// ─────────────────────────────────────────
// Capturar mensaje informativo (no error)
// ─────────────────────────────────────────

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

export function captureMessage(
  message: string,
  level: SeverityLevel = 'info'
) {
  if (__DEV__) {
    console.log(`[sentry:${level}]`, message)
    return
  }
  Sentry?.captureMessage(message, level)
}

// ─────────────────────────────────────────
// Medir performance de operaciones críticas
// ─────────────────────────────────────────

export function startTransaction(name: string, op: string) {
  // Sentry v8+ usa spans en lugar de transactions
  return Sentry?.startInactiveSpan({ name, op })
}

// Re-export del módulo Sentry (puede ser null si no está instalado)
export { Sentry }
