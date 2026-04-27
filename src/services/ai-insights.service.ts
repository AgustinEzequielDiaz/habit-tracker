/**
 * ai-insights.service.ts
 *
 * Thin wrapper sobre la Edge Function ai-insights.
 * Propaga el errorCode tipado para que la UI pueda mostrar
 * el mensaje correcto sin exponer detalles técnicos al usuario.
 */

import { supabase } from '@/services/supabase'

// ─── Tipos públicos ───────────────────────────────────────────

export type InsightType = 'tip' | 'warning' | 'achievement' | 'challenge'

export interface AIInsight {
  type: InsightType
  title: string
  body: string
}

export interface AIInsightsResponse {
  insights: AIInsight[]
  cached: boolean
  generatedDate: string
}

/**
 * Códigos de error posibles. El componente los mapea a mensajes en español
 * sin exponer detalles técnicos al usuario.
 *
 * - key_missing / key_invalid → error de configuración del servidor
 * - quota_exceeded            → sin crédito en la cuenta de OpenAI
 * - rate_limit                → demasiadas requests, reintentar en minutos
 * - openai_unavailable        → OpenAI caído o 5xx transitorio
 * - openai_timeout            → OpenAI no respondió a tiempo
 * - parse_error               → respuesta de OpenAI malformada
 * - no_auth                   → sesión inválida (raro, normalmente auto-refresh)
 * - internal_error            → error inesperado en la Edge Function
 * - network_error             → sin conexión a internet
 * - unknown                   → cualquier otro error no tipado
 */
export type AIErrorCode =
  | 'key_missing'
  | 'key_invalid'
  | 'quota_exceeded'
  | 'rate_limit'
  | 'openai_unavailable'
  | 'openai_timeout'
  | 'parse_error'
  | 'no_auth'
  | 'internal_error'
  | 'network_error'
  | 'unknown'

/**
 * Error tipado que incluye el código para que la UI pueda ramificar
 * el mensaje mostrado al usuario.
 */
export class AIInsightsError extends Error {
  readonly code: AIErrorCode
  constructor(message: string, code: AIErrorCode) {
    super(message)
    this.name = 'AIInsightsError'
    this.code = code
  }
}

// ─── Servicio ─────────────────────────────────────────────────

class AIInsightsService {
  async fetchInsights(forceRefresh = false): Promise<AIInsightsResponse> {
    // Obtener JWT del usuario para autorizar la Edge Function
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new AIInsightsError('Sesión no encontrada', 'no_auth')
    }

    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-insights`

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ forceRefresh }),
      })
    } catch {
      // fetch lanzó excepción → sin conexión o DNS falla
      throw new AIInsightsError('Sin conexión a internet', 'network_error')
    }

    // Parsear body (siempre JSON, tanto en éxito como en error)
    let body: Record<string, unknown>
    try {
      body = await res.json()
    } catch {
      throw new AIInsightsError('Respuesta inesperada del servidor', 'unknown')
    }

    // Respuesta exitosa
    if (res.ok) {
      return body as unknown as AIInsightsResponse
    }

    // Respuesta de error: la Edge Function incluye `errorCode`
    const errorCode = (body.errorCode as AIErrorCode) ?? 'unknown'
    const errorMsg  = (body.error as string) ?? 'Error desconocido'
    throw new AIInsightsError(errorMsg, errorCode)
  }
}

export const aiInsightsService = new AIInsightsService()
