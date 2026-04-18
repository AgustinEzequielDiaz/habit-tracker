import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OfflineOperation {
  id: string
  operation: 'complete_habit' | 'uncomplete_habit'
  payload: {
    habit_id: string
    completed_date: string
    value?: number
    note?: string
  }
  created_at: string
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { operations }: { operations: OfflineOperation[] } = await req.json()

    // Ordenar por fecha de creación para aplicar en orden cronológico
    const sorted = [...operations].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const op of sorted) {
      try {
        if (op.operation === 'complete_habit') {
          const { error } = await supabase.from('habit_completions').upsert(
            {
              habit_id: op.payload.habit_id,
              user_id: user.id,
              completed_date: op.payload.completed_date,
              value: op.payload.value ?? null,
              note: op.payload.note ?? null,
              source: 'offline_sync',
            },
            { onConflict: 'habit_id,user_id,completed_date', ignoreDuplicates: true }
          )
          results.push({ id: op.id, success: !error, error: error?.message })
        } else if (op.operation === 'uncomplete_habit') {
          const { error } = await supabase
            .from('habit_completions')
            .delete()
            .eq('habit_id', op.payload.habit_id)
            .eq('user_id', user.id)
            .eq('completed_date', op.payload.completed_date)
          results.push({ id: op.id, success: !error, error: error?.message })
        }
      } catch (err) {
        results.push({ id: op.id, success: false, error: String(err) })
      }
    }

    const synced = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return new Response(JSON.stringify({ synced, failed, results }), {
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
