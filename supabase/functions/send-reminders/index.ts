import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const ANTI_FATIGUE_THRESHOLD = 5

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const nowUTC = new Date()
    const currentHour = nowUTC.getUTCHours()
    const currentMinute = nowUTC.getUTCMinutes()

    // ── Ventana de fechas para completions ──────────────────────────────
    // Los clientes guardan completed_date con su hora LOCAL, no UTC.
    // Un usuario en UTC-12 al mediodía tiene la misma fecha local que
    // el UTC de 12 horas atrás → su completed_date puede ser "hoy UTC"
    // o "ayer UTC" dependiendo del offset.
    // Para no mandar notificaciones falsas, buscamos completions en
    // cualquiera de los dos días posibles y los unimos.
    const todayUTC = nowUTC.toISOString().split('T')[0]
    const yesterdayUTC = new Date(nowUTC)
    yesterdayUTC.setUTCDate(nowUTC.getUTCDate() - 1)
    const yesterdayUTCStr = yesterdayUTC.toISOString().split('T')[0]

    const timeWindow = `${String(currentHour).padStart(2, '0')}:${String(currentMinute < 30 ? '00' : '30').padStart(2, '0')}`

    // Obtener usuarios con notificaciones habilitadas en esta hora
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_prefs')
      .select('user_id, push_token, ignored_count')
      .eq('enabled', true)
      .not('push_token', 'is', null)
      .gte('reminder_time', timeWindow + ':00')
      .lt('reminder_time', timeWindow + ':59')

    if (prefsError) {
      console.error('Error fetching notification_prefs:', prefsError)
      return new Response(JSON.stringify({ error: prefsError.message }), { status: 500 })
    }

    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const messages = []

    for (const pref of prefs) {
      try {
        // Anti-fatiga: si ignoró muchas notificaciones, saltar esta hora
        if (pref.ignored_count >= ANTI_FATIGUE_THRESHOLD && currentHour % 3 !== 0) continue

        // Obtener hábitos activos del usuario
        const { data: habits } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', pref.user_id)
          .eq('is_active', true)
          .eq('is_archived', false)

        if (!habits || habits.length === 0) continue

        // ── Completions: buscar en today UTC Y yesterday UTC ──────────────
        // Cubre todos los offsets posibles sin necesitar almacenar timezone.
        // Si el usuario completó un hábito con fecha "ayer UTC" (por estar en
        // UTC-X) o con "hoy UTC", lo detectamos igualmente.
        const { data: completions } = await supabase
          .from('habit_completions')
          .select('habit_id, completed_date')
          .eq('user_id', pref.user_id)
          .in('completed_date', [todayUTC, yesterdayUTCStr])

        // Construir set de IDs completados en CUALQUIERA de los dos días
        const completedIds = new Set(completions?.map((c) => c.habit_id) ?? [])
        const pending = habits.filter((h) => !completedIds.has(h.id))

        if (pending.length === 0) continue

        const message = buildMessage(pref.push_token, pending.length, habits.length)
        messages.push(message)
      } catch (err) {
        // Un usuario fallando no bloquea a los demás
        console.error(`Error processing notification for user ${pref.user_id}:`, err)
      }
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Enviar a Expo Push Service en batches de 100
    let totalSent = 0
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100)
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        })
        if (response.ok) totalSent += batch.length
        else console.error('Expo push error:', await response.text())
      } catch (err) {
        console.error('Expo push fetch failed:', err)
      }
    }

    console.log(`Notifications sent: ${totalSent}/${messages.length}`)
    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('send-reminders fatal error:', error)
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
    to:        token,
    sound:     'default',
    title:     msg.title,
    body:      msg.body,
    data:      { screen: 'today' },
    channelId: 'reminders',
  }
}
