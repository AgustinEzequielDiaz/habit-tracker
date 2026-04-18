import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const ANTI_FATIGUE_THRESHOLD = 5  // Si ignoró 5+ notifs, reducir frecuencia

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const nowUTC = new Date()
    const currentHour = nowUTC.getUTCHours()
    const currentMinute = nowUTC.getUTCMinutes()
    const todayDate = nowUTC.toISOString().split('T')[0]

    // Formato HH:MM para comparar con reminder_time
    const timeWindow = `${String(currentHour).padStart(2, '0')}:${String(currentMinute < 30 ? '00' : '30').padStart(2, '0')}`

    // Obtener usuarios con notificaciones habilitadas en esta hora
    const { data: prefs } = await supabase
      .from('notification_prefs')
      .select('user_id, push_token, ignored_count')
      .eq('enabled', true)
      .not('push_token', 'is', null)
      .gte('reminder_time', timeWindow + ':00')
      .lt('reminder_time', timeWindow + ':59')

    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const messages = []

    for (const pref of prefs) {
      // Anti-fatiga: si ignoró muchas notificaciones, saltar esta hora
      if (pref.ignored_count >= ANTI_FATIGUE_THRESHOLD) {
        // Solo notificar cada 3 horas (hora divisible por 3)
        if (currentHour % 3 !== 0) continue
      }

      // Verificar si el usuario ya completó todos sus hábitos hoy
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', pref.user_id)
        .eq('is_active', true)
        .eq('is_archived', false)

      if (!habits || habits.length === 0) continue

      const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id')
        .eq('user_id', pref.user_id)
        .eq('completed_date', todayDate)

      const completedIds = new Set(completions?.map((c) => c.habit_id) ?? [])
      const pending = habits.filter((h) => !completedIds.has(h.id))

      if (pending.length === 0) continue  // Ya completó todo, no molestar

      const message = buildMessage(pref.push_token, pending.length, habits.length)
      messages.push(message)
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Enviar a Expo Push Service (en batches de 100)
    let totalSent = 0
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100)
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })

      if (response.ok) totalSent += batch.length
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function buildMessage(token: string, pendingCount: number, totalCount: number) {
  const completedCount = totalCount - pendingCount
  const messages = [
    {
      title: '¿Cómo va el día?',
      body: `Te quedan ${pendingCount} hábito${pendingCount > 1 ? 's' : ''} por completar`,
    },
    {
      title: 'Mantén el ritmo',
      body: `Ya completaste ${completedCount} de ${totalCount} hábitos hoy`,
    },
    {
      title: 'Pequeños pasos, grandes cambios',
      body: `Tenés ${pendingCount} hábito${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} hoy`,
    },
  ]

  const msg = messages[Math.floor(Math.random() * messages.length)]

  return {
    to: token,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    data: { screen: 'today' },
    channelId: 'reminders',
  }
}
