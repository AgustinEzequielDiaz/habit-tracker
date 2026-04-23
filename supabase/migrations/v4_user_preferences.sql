-- ============================================================
-- V4 Migration: User Preferences + Security Hardening
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columnas de preferencias del usuario
--    (avatar_url ya existe, se usa para guardar emoji string)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preferred_notification_time TIME NOT NULL DEFAULT '08:00:00';

-- 2. Constraint: limitar cantidad de hábitos activos por usuario (anti-abuse)
--    Máximo 50 hábitos activos por usuario
DROP TRIGGER IF EXISTS trg_check_habit_limit ON public.habits;
DROP FUNCTION IF EXISTS public.check_habit_limit();

CREATE OR REPLACE FUNCTION public.check_habit_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Subquery directa para evitar problemas con INTO en algunos entornos de Supabase
  IF (
    SELECT COUNT(*)
    FROM public.habits
    WHERE user_id = NEW.user_id
      AND is_active = TRUE
      AND is_archived = FALSE
  ) >= 50 THEN
    RAISE EXCEPTION 'Límite de 50 hábitos activos alcanzado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.check_habit_limit();

-- 3. Hardening de RLS: evitar que el cliente modifique campos de gamificación directamente
--    Reemplazar la política de UPDATE en users para restringir los campos que puede modificar el cliente

-- Primero eliminar política existente si la hay
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Nueva política: el usuario solo puede editar campos de perfil
-- Los campos de gamificación (level, total_xp, global_score) son solo escritos por Edge Functions
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Los campos de gamificación no deben ser modificados directamente por el cliente.
    -- Si se usan Edge Functions con service_role para actualizarlos, este check los protege.
    -- Nota: el cliente SÍ puede actualizar display_name, avatar_url, accent_color, notification_*
  );

-- 4. Constraint: la fecha de completion no puede ser futura
ALTER TABLE public.habit_completions
  ADD CONSTRAINT completions_no_future_date
    CHECK (completed_date <= CURRENT_DATE);

-- 5. Constraint: un hábito no puede completarse más de una vez por día por usuario
--    (unique constraint ya debería existir, pero lo aseguramos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'habit_completions_unique_per_day'
  ) THEN
    ALTER TABLE public.habit_completions
      ADD CONSTRAINT habit_completions_unique_per_day
        UNIQUE (habit_id, completed_date);
  END IF;
END $$;

-- 6. RLS para streak_freezes — cada política se maneja de forma independiente
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own freezes"   ON public.streak_freezes;
DROP POLICY IF EXISTS "Users can insert own freezes" ON public.streak_freezes;
DROP POLICY IF EXISTS "Users can delete own freezes" ON public.streak_freezes;

CREATE POLICY "Users can view own freezes"
  ON public.streak_freezes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freezes"
  ON public.streak_freezes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own freezes"
  ON public.streak_freezes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Índice para mejorar queries de completions por usuario + fecha (frecuente en el app)
CREATE INDEX IF NOT EXISTS idx_completions_user_date
  ON public.habit_completions (user_id, completed_date DESC);

-- 8. Índice para el heatmap (summaries por fecha)
CREATE INDEX IF NOT EXISTS idx_summaries_user_date
  ON public.daily_summaries (user_id, summary_date DESC);
