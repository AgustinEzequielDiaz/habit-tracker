/**
 * ai-insights — Edge Function
 *
 * Genera insights personalizados para el usuario usando GPT-4o-mini.
 * Cachea el resultado 24h en la tabla ai_insights.
 *
 * SETUP:
 *   supabase secrets set OPENAI_API_KEY=sk-...
 *   supabase functions deploy ai-insights
 *
 * RESPUESTA OK:
 *   { insights: AIInsight[], cached: boolean, generatedDate: string }
 *
 * RESPUESTA ERROR:
 *   { error: string, errorCode: AIErrorCode }
 *
 * errorCode values:
 *   'key_missing'       — OPENAI_API_KEY no configurada en Supabase Secrets
 *   'key_invalid'       — API key rechazada por OpenAI (401)
 *   'quota_exceeded'    — Sin saldo/crédito en la cuenta de OpenAI
 *   'rate_limit'        — Demasiadas requests en poco tiempo (retry en minutos)
 *   'openai_unavailable'— OpenAI retornó 5xx (servicio caído, transitorio)
 *   'openai_timeout'    — OpenAI no respondió en el tiempo límite
 *   'parse_error'       — Respuesta de OpenAI no pudo parsearse
 *   'no_auth'           — JWT inválido o ausente
 *   'internal_error'    — Error inesperado en la Edge Function
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Tipos ────────────────────────────────────────────────────

type AIErrorCode =
  | 'key_missing'
  | 'key_invalid'
  | 'quota_exceeded'
  | 'rate_limit'
  | 'openai_unavailable'
  | 'openai_timeout'
  | 'parse_error'
  | 'no_auth'
  | 'internal_error'

interface AIInsight {
  type: 'tip' | 'warning' | 'achievement' | 'challenge'
  title: string
  body: string
}

interface HabitRow {
  id: string
  name: string
  difficulty: number
  current_streak: number
  frequency_type: string
}

interface CompletionRow {
  habit_id: string
  completed_date: string
}

interface MoodRow {
  entry_date: string
  mood: number
}

// ─── Handler principal ────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // ── Autenticación ──────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return jsonError('No autorizado', 401, 'no_auth')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey   = Deno.env.get('OPENAI_API_KEY')

    // Key ausente: error de configuración del servidor
    if (!openaiKey) {
      console.error('[ai-insights] OPENAI_API_KEY no configurada en Supabase Secrets')
      return jsonError('Servicio de IA no configurado', 503, 'key_missing')
    }

    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return jsonError('No autorizado', 401, 'no_auth')
    }
    const userId = user.id
    const adminClient = createClient(supabaseUrl, serviceKey)

    // ── Body opcional ──────────────────────────────────────────
    let forceRefresh = false
    try {
      const body = await req.json()
      forceRefresh = body?.forceRefresh === true
    } catch { /* body vacío — ok */ }

    // ── Chequear caché ─────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]

    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from('ai_insights')
        .select('insights, generated_date')
        .eq('user_id', userId)
        .eq('generated_date', today)
        .maybeSingle()

      if (cached) {
        return jsonOk({
          insights: cached.insights as AIInsight[],
          cached: true,
          generatedDate: cached.generated_date,
        })
      }
    }

    // ── Recolectar contexto del usuario ───────────────────────
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const fromDate = fourteenDaysAgo.toISOString().split('T')[0]

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const moodFromDate = sevenDaysAgo.toISOString().split('T')[0]

    const [habitsRes, completionsRes, moodRes, userRes] = await Promise.all([
      adminClient.from('habits').select('id, name, difficulty, current_streak, frequency_type').eq('user_id', userId).eq('is_active', true),
      adminClient.from('habit_completions').select('habit_id, completed_date').eq('user_id', userId).gte('completed_date', fromDate),
      adminClient.from('mood_entries').select('entry_date, mood').eq('user_id', userId).gte('entry_date', moodFromDate).order('entry_date', { ascending: true }),
      adminClient.from('users').select('global_score, total_xp, streak_current, streak_best, display_name').eq('id', userId).single(),
    ])

    const habits:      HabitRow[]      = (habitsRes.data      ?? []) as HabitRow[]
    const completions: CompletionRow[] = (completionsRes.data ?? []) as CompletionRow[]
    const moods:       MoodRow[]       = (moodRes.data        ?? []) as MoodRow[]
    const userData = userRes.data

    // ── Construir prompt ───────────────────────────────────────
    const completionsByHabit = new Map<string, Set<string>>()
    for (const c of completions) {
      if (!completionsByHabit.has(c.habit_id)) completionsByHabit.set(c.habit_id, new Set())
      completionsByHabit.get(c.habit_id)!.add(c.completed_date)
    }

    const habitSummaries = habits.map((h) => {
      const done = completionsByHabit.get(h.id)?.size ?? 0
      const rate = Math.round((done / 14) * 100)
      return `- "${h.name}": ${rate}% en 14d, racha ${h.current_streak ?? 0}d, dificultad ${h.difficulty ?? 3}/5`
    })

    const moodSummary = moods.length > 0
      ? moods.map((m) => `${m.entry_date}: ${m.mood}/5`).join(', ')
      : 'Sin registros de mood en los últimos 7 días'
    const avgMood = moods.length > 0
      ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length).toFixed(1)
      : null

    const systemPrompt = `Eres un coach experto en psicología de hábitos y bienestar personal.
Tu tarea es analizar los datos de progreso de un usuario y generar exactamente 3 insights accionables y personalizados.

REGLAS IMPORTANTES:
- Responde SOLO con JSON válido, sin texto adicional, sin markdown.
- El formato debe ser: { "insights": [ { "type": "...", "title": "...", "body": "..." }, ... ] }
- Los tipos válidos son: "tip", "warning", "achievement", "challenge"
- "achievement": logro o racha positiva que merece reconocimiento
- "tip": sugerencia práctica basada en los datos
- "warning": alerta de riesgo de abandono o caída de rendimiento
- "challenge": desafío motivacional para el próximo período
- Máximo 1 "warning" para no desmotivar
- El "body" debe ser específico, mencionar el hábito por nombre, y dar una acción concreta
- Máximo 2 oraciones por "body"
- Idioma: español rioplatense (Argentina)
- Tono: cálido, directo, motivador, sin ser condescendiente`

    const userMessage = `Datos del usuario:
- Nombre: ${userData?.display_name ?? 'Usuario'}
- Score global: ${userData?.global_score ?? 0}/100
- XP total: ${userData?.total_xp ?? 0}
- Racha actual: ${userData?.streak_current ?? 0} días
- Mejor racha histórica: ${userData?.streak_best ?? 0} días

Hábitos activos y performance (últimos 14 días):
${habitSummaries.length > 0 ? habitSummaries.join('\n') : '- Sin hábitos activos'}

Mood últimos 7 días: ${moodSummary}
Promedio mood: ${avgMood ?? 'sin datos'}/5

Generá 3 insights específicos basados en estos datos.`

    // ── Llamada a OpenAI con timeout ───────────────────────────
    // Timeout de 25s: Edge Functions tienen límite de 30s, dejamos margen
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25_000)

    let openaiRes: Response
    try {
      openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 600,
          response_format: { type: 'json_object' },
        }),
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId)
      // AbortError = timeout; cualquier otro = red caída
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError'
      console.error('[ai-insights] fetch error:', fetchErr)
      return isTimeout
        ? jsonError('OpenAI no respondió a tiempo', 504, 'openai_timeout')
        : jsonError('No se pudo conectar con OpenAI', 502, 'openai_unavailable')
    }
    clearTimeout(timeoutId)

    // ── Mapeo de errores HTTP de OpenAI ───────────────────────
    if (!openaiRes.ok) {
      const rawBody = await openaiRes.text()
      console.error(`[ai-insights] OpenAI HTTP ${openaiRes.status}:`, rawBody)

      // Intentar parsear el body de error de OpenAI para obtener el código exacto
      let openaiErrorCode: string | undefined
      try {
        const parsed = JSON.parse(rawBody)
        openaiErrorCode = parsed?.error?.code ?? parsed?.error?.type
      } catch { /* body no era JSON */ }

      switch (openaiRes.status) {
        case 401:
          // API key inválida, revocada o sin permisos
          return jsonError('Clave de API inválida', 502, 'key_invalid')

        case 429: {
          // OpenAI usa el mismo status para dos situaciones muy distintas:
          // - insufficient_quota: sin saldo/crédito → el usuario no puede hacer nada
          // - rate_limit_exceeded: demasiadas requests → esperar y reintentar
          const isQuota =
            openaiErrorCode === 'insufficient_quota' ||
            rawBody.includes('insufficient_quota') ||
            rawBody.includes('exceeded your current quota')
          return isQuota
            ? jsonError('Sin crédito disponible en la cuenta de IA', 402, 'quota_exceeded')
            : jsonError('Límite de requests alcanzado, intentá en unos minutos', 429, 'rate_limit')
        }

        case 400:
          // Request malformada (no debería pasar con este código, pero por las dudas)
          console.error('[ai-insights] Bad request a OpenAI:', rawBody)
          return jsonError('Error al preparar la consulta a la IA', 500, 'internal_error')

        case 500:
        case 502:
        case 503:
        case 504:
          // OpenAI caído o con problemas internos — error transitorio
          return jsonError('El servicio de IA está temporalmente fuera de línea', 502, 'openai_unavailable')

        default:
          return jsonError(`Error de OpenAI: ${openaiRes.status}`, 502, 'openai_unavailable')
      }
    }

    // ── Parsear respuesta ─────────────────────────────────────
    const openaiData = await openaiRes.json()
    const rawContent = openaiData.choices?.[0]?.message?.content ?? '{}'
    const tokensUsed = openaiData.usage?.total_tokens ?? null

    // Verificar que OpenAI no haya devuelto finish_reason problemático
    const finishReason = openaiData.choices?.[0]?.finish_reason
    if (finishReason === 'content_filter') {
      console.warn('[ai-insights] OpenAI filtró el contenido:', rawContent)
      return jsonError('Respuesta de IA filtrada por políticas de contenido', 500, 'parse_error')
    }

    let insights: AIInsight[] = []
    try {
      const parsed = JSON.parse(rawContent)
      insights = Array.isArray(parsed.insights) ? parsed.insights : []
    } catch {
      console.error('[ai-insights] Error parseando JSON de OpenAI:', rawContent)
      return jsonError('Respuesta de IA en formato inesperado', 500, 'parse_error')
    }

    // Validar y sanitizar cada insight
    insights = insights
      .filter(
        (i): i is AIInsight =>
          typeof i === 'object' && i !== null &&
          ['tip', 'warning', 'achievement', 'challenge'].includes(i?.type) &&
          typeof i.title === 'string' && i.title.trim().length > 0 &&
          typeof i.body  === 'string' && i.body.trim().length > 0
      )
      .map((i) => ({
        type:  i.type,
        title: i.title.trim().slice(0, 120),   // cap de seguridad
        body:  i.body.trim().slice(0, 400),
      }))
      .slice(0, 3)

    if (insights.length === 0) {
      console.warn('[ai-insights] OpenAI devolvió 0 insights válidos:', rawContent)
      return jsonError('No se pudieron generar insights válidos', 500, 'parse_error')
    }

    // ── Persistir en caché ─────────────────────────────────────
    const { error: upsertError } = await adminClient
      .from('ai_insights')
      .upsert(
        { user_id: userId, generated_date: today, insights, model: 'gpt-4o-mini', tokens_used: tokensUsed },
        { onConflict: 'user_id,generated_date' }
      )
    if (upsertError) {
      // No bloquear la respuesta por un fallo de caché — los insights igual se devuelven
      console.warn('[ai-insights] Error guardando en caché:', upsertError.message)
    }

    return jsonOk({ insights, cached: false, generatedDate: today })

  } catch (err) {
    console.error('[ai-insights] Error inesperado:', err)
    return jsonError('Error interno del servidor', 500, 'internal_error')
  }
})

// ─── Helpers ─────────────────────────────────────────────────

function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function jsonError(message: string, status: number, errorCode: AIErrorCode): Response {
  return new Response(JSON.stringify({ error: message, errorCode }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
