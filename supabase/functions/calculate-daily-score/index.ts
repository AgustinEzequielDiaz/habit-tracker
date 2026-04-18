import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─────────────────────────────────────────
// Algoritmo de scoring (igual que en el cliente)
// ─────────────────────────────────────────

const DIFFICULTY_WEIGHT = { easy: 0.8, normal: 1.0, hard: 1.3 }

const XP_BY_RATE = (rate: number): number => {
  if (rate >= 1.0) return 100
  if (rate >= 0.8) return 60
  if (rate >= 0.5) return 30
  return 10
}

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]

function calcLevel(totalXp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return level
}

function calcHabitScore(
  completionsLast30: number,
  expectedLast30: number,
  maxConsecutiveGap: number,
  difficulty: 'easy' | 'normal' | 'hard'
): number {
  if (expectedLast30 === 0) return 0
  const completionRate = completionsLast30 / expectedLast30
  const gapPenalty = Math.max(0, (maxConsecutiveGap - 3) * 0.05)
  const regularityFactor = Math.max(0.5, 1 - gapPenalty)
  const diffWeight = DIFFICULTY_WEIGHT[difficulty]
  return Math.min(100, completionRate * regularityFactor * diffWeight * 100)
}

// ─────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setUTCDate(today.getUTCDate() - 1)
    const targetDate = yesterday.toISOString().split('T')[0]

    const thirtyDaysAgo = new Date(yesterday)
    thirtyDaysAgo.setUTCDate(yesterday.getUTCDate() - 29)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

    // Obtener todos los usuarios con hábitos activos
    const { data: activeUsers } = await supabase
      .from('habits')
      .select('user_id')
      .eq('is_active', true)
      .eq('is_archived', false)

    const uniqueUserIds = [...new Set(activeUsers?.map((h) => h.user_id) ?? [])]
    console.log(`Processing ${uniqueUserIds.length} users for date ${targetDate}`)

    for (const userId of uniqueUserIds) {
      await processUser(supabase, userId, targetDate, fromDate)
    }

    return new Response(JSON.stringify({ success: true, usersProcessed: uniqueUserIds.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('calculate-daily-score error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  targetDate: string,
  fromDate: string
) {
  // 1. Obtener hábitos activos del usuario
  const { data: habits } = await supabase
    .from('habits')
    .select('id, difficulty')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_archived', false)

  if (!habits || habits.length === 0) return

  // 2. Obtener completions de los últimos 30 días
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_date')
    .eq('user_id', userId)
    .gte('completed_date', fromDate)
    .lte('completed_date', targetDate)

  const completionsByHabit = new Map<string, Set<string>>()
  for (const c of completions ?? []) {
    if (!completionsByHabit.has(c.habit_id)) {
      completionsByHabit.set(c.habit_id, new Set())
    }
    completionsByHabit.get(c.habit_id)!.add(c.completed_date)
  }

  // 3. Calcular score por hábito
  const habitScores: number[] = []
  const weights: number[] = []

  for (const habit of habits) {
    const doneSet = completionsByHabit.get(habit.id) ?? new Set<string>()
    const done = doneSet.size

    // Calcular gap máximo consecutivo
    let maxGap = 0
    let currentGap = 0
    const cur = new Date(fromDate)
    const end = new Date(targetDate)
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0]
      if (!doneSet.has(dateStr)) {
        currentGap++
        maxGap = Math.max(maxGap, currentGap)
      } else {
        currentGap = 0
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }

    const score = calcHabitScore(done, 30, maxGap, habit.difficulty)
    habitScores.push(score)
    weights.push(DIFFICULTY_WEIGHT[habit.difficulty as keyof typeof DIFFICULTY_WEIGHT])
  }

  // 4. Score global ponderado
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const globalScore =
    totalWeight > 0
      ? habitScores.reduce((sum, s, i) => sum + s * weights[i], 0) / totalWeight
      : 0

  // 5. Completions del día objetivo
  const dayDone = completions?.filter((c) => c.completed_date === targetDate).length ?? 0
  const completionRate = habits.length > 0 ? dayDone / habits.length : 0
  const xpEarned = XP_BY_RATE(completionRate)

  // 6. Upsert daily_summary
  await supabase.from('daily_summaries').upsert({
    user_id: userId,
    summary_date: targetDate,
    habits_total: habits.length,
    habits_completed: dayDone,
    completion_rate: Math.round(completionRate * 100 * 100) / 100,
    global_score: Math.round(globalScore * 100) / 100,
    xp_earned: xpEarned,
  })

  // 7. Actualizar usuario
  const { data: user } = await supabase
    .from('users')
    .select('total_xp, streak_best')
    .eq('id', userId)
    .single()

  if (user) {
    const newTotalXp = (user.total_xp ?? 0) + xpEarned
    const newLevel = calcLevel(newTotalXp)

    await supabase
      .from('users')
      .update({ global_score: Math.round(globalScore * 100) / 100, total_xp: newTotalXp, level: newLevel })
      .eq('id', userId)
  }

  // 8. Actualizar streaks
  await updateStreaks(supabase, userId, habits, completionsByHabit, targetDate)

  // 9. Evaluar achievements
  await checkAchievements(supabase, userId, dayDone, habits.length, globalScore)
}

async function updateStreaks(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  habits: { id: string }[],
  completionsByHabit: Map<string, Set<string>>,
  targetDate: string
) {
  for (const habit of habits) {
    const doneSet = completionsByHabit.get(habit.id) ?? new Set<string>()
    const didCompleteToday = doneSet.has(targetDate)

    const { data: activeStreak } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('habit_id', habit.id)
      .is('end_date', null)
      .single()

    if (didCompleteToday) {
      if (activeStreak) {
        // Extender racha existente
        await supabase
          .from('habit_streaks')
          .update({ length_days: activeStreak.length_days + 1 })
          .eq('id', activeStreak.id)
      } else {
        // Iniciar nueva racha
        await supabase.from('habit_streaks').insert({
          habit_id: habit.id,
          user_id: userId,
          start_date: targetDate,
          length_days: 1,
        })
      }
    } else if (activeStreak) {
      // Cerrar racha por fallo
      await supabase
        .from('habit_streaks')
        .update({ end_date: targetDate, length_days: activeStreak.length_days })
        .eq('id', activeStreak.id)

      // Actualizar best streak del usuario
      const { data: user } = await supabase
        .from('users')
        .select('streak_best')
        .eq('id', userId)
        .single()

      if (user && activeStreak.length_days > (user.streak_best ?? 0)) {
        await supabase
          .from('users')
          .update({ streak_best: activeStreak.length_days })
          .eq('id', userId)
      }
    }
  }
}

async function checkAchievements(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  dayCompleted: number,
  dayTotal: number,
  globalScore: number
) {
  const toUnlock: string[] = []

  if (dayCompleted >= 1) toUnlock.push('first_completion')
  if (dayTotal > 0 && dayCompleted === dayTotal) toUnlock.push('perfect_day')
  if (globalScore >= 70) toUnlock.push('score_70')
  if (globalScore >= 90) toUnlock.push('score_90')

  for (const key of toUnlock) {
    await supabase
      .from('user_achievements')
      .upsert({ user_id: userId, achievement_key: key }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true })
  }
}
