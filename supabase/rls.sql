-- ============================================================
-- ROW LEVEL SECURITY — Ejecutar después de schema.sql
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE POLICY "users: select own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────
CREATE POLICY "habits: all own" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- HABIT COMPLETIONS
-- ─────────────────────────────────────────
CREATE POLICY "completions: all own" ON public.habit_completions
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- HABIT STREAKS
-- ─────────────────────────────────────────
CREATE POLICY "streaks: all own" ON public.habit_streaks
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- DAILY SUMMARIES
-- ─────────────────────────────────────────
CREATE POLICY "summaries: select own" ON public.daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Solo service role puede insertar/actualizar (cron job)
CREATE POLICY "summaries: service insert" ON public.daily_summaries
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "summaries: service update" ON public.daily_summaries
  FOR UPDATE USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- NOTIFICATION PREFS
-- ─────────────────────────────────────────
CREATE POLICY "notif_prefs: all own" ON public.notification_prefs
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- USER ACHIEVEMENTS
-- ─────────────────────────────────────────
CREATE POLICY "achievements: select own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "achievements: service insert" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
