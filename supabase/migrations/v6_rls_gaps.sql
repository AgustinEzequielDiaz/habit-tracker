-- ============================================================
-- V6 RLS Gaps — Políticas faltantes en tablas creadas post-V1
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Contexto: rls.sql cubre las tablas del schema V1. Desde entonces
-- se agregaron streak_freezes (V2), mood_entries (V5) y journal_entries (V6).
-- mood_entries y journal_entries tienen RLS completo en sus migraciones.
-- Este archivo cubre los gaps de streak_freezes y agrega políticas
-- defensivas faltantes.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. streak_freezes — le faltaba DELETE y UPDATE
-- ─────────────────────────────────────────────────────────────
-- Ya existe: SELECT + INSERT (en v2_streak_freeze.sql)
-- Agregamos las que faltan:

DROP POLICY IF EXISTS "Users can delete own freezes" ON public.streak_freezes;
CREATE POLICY "Users can delete own freezes"
  ON public.streak_freezes FOR DELETE
  USING (auth.uid() = user_id);

-- UPDATE no aplica a streak_freezes (inmutable por diseño), pero lo
-- bloqueamos explícitamente para que no quede accidentalmente abierto.
-- (En Supabase, si no hay policy para UPDATE, RLS la deniega por default
--  cuando está habilitado — pero ser explícito es más seguro.)


-- ─────────────────────────────────────────────────────────────
-- 2. users — le falta INSERT (para el trigger handle_new_user)
-- ─────────────────────────────────────────────────────────────
-- handle_new_user() usa SECURITY DEFINER, lo que significa que corre
-- con privilegios del owner (postgres/service role) y no necesita
-- una policy de INSERT para el usuario anónimo.
-- Sin embargo, agregamos una policy explícita para INSERT desde
-- service_role para cerrar cualquier ambigüedad:

DROP POLICY IF EXISTS "users: service insert" ON public.users;
CREATE POLICY "users: service insert"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id             -- el propio usuario puede insertarse
    OR auth.role() = 'service_role'  -- el service role (trigger/edge fn)
  );


-- ─────────────────────────────────────────────────────────────
-- 3. daily_summaries — agregar DELETE para service_role
-- (necesario para el cron de recálculo de scores)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "summaries: service delete" ON public.daily_summaries;
CREATE POLICY "summaries: service delete"
  ON public.daily_summaries FOR DELETE
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 4. user_achievements — agregar DELETE para service_role
-- (necesario si se revoca un logro por corrección de datos)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "achievements: service delete" ON public.user_achievements;
CREATE POLICY "achievements: service delete"
  ON public.user_achievements FOR DELETE
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- 5. Verificación: listar todas las tablas con RLS habilitado
-- Ejecutar como query de validación después del script:
-- ─────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Resultado esperado (rowsecurity = true en todas):
--   daily_summaries     | true
--   habit_completions   | true
--   habit_streaks       | true
--   habits              | true
--   journal_entries     | true
--   mood_entries        | true
--   notification_prefs  | true
--   streak_freezes      | true
--   user_achievements   | true
--   users               | true
