-- ============================================================
-- V5 Migration: Mood Tracking + Non-Daily Frequencies
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla mood_entries — Registro diario de estado de ánimo
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  mood          SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Un registro de mood por día por usuario
  CONSTRAINT mood_entries_unique_per_day UNIQUE (user_id, entry_date)
);

-- Índice para queries de historial
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date
  ON public.mood_entries (user_id, entry_date DESC);

-- RLS para mood_entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mood entries"   ON public.mood_entries;
DROP POLICY IF EXISTS "Users can insert own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can update own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can delete own mood entries" ON public.mood_entries;

CREATE POLICY "Users can view own mood entries"
  ON public.mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON public.mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON public.mood_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON public.mood_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION public.update_mood_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mood_updated_at ON public.mood_entries;
CREATE TRIGGER trg_mood_updated_at
  BEFORE UPDATE ON public.mood_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_mood_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 2. Frecuencias no diarias en habits
-- ─────────────────────────────────────────────────────────────
-- frequency_type: 'daily' | 'weekly' | 'custom'
-- frequency_days: para 'custom' = N veces por semana (1-7)
-- frequency_weekdays: para 'weekly' = días específicos (array, ej: [1,3,5] = lunes, miércoles, viernes)

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS frequency_type TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
  ADD COLUMN IF NOT EXISTS frequency_days INTEGER DEFAULT NULL
    CHECK (frequency_days IS NULL OR (frequency_days >= 1 AND frequency_days <= 7)),
  ADD COLUMN IF NOT EXISTS frequency_weekdays INTEGER[] DEFAULT NULL;

-- Backfill: todos los hábitos existentes son diarios
UPDATE public.habits
  SET frequency_type = 'daily'
  WHERE frequency_type IS NULL OR frequency_type = '';

-- Índice para filtrar hábitos por tipo de frecuencia
CREATE INDEX IF NOT EXISTS idx_habits_frequency_type
  ON public.habits (user_id, frequency_type)
  WHERE is_active = TRUE AND is_archived = FALSE;


-- ─────────────────────────────────────────────────────────────
-- 3. Actualizar vista habits_with_streaks para incluir frequency
-- ─────────────────────────────────────────────────────────────
-- Nota: si la vista fue definida en el schema principal, hay que
-- recrearla. Verificar primero que exista.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'habits_with_streaks' AND schemaname = 'public') THEN
    -- Recrear la vista incluyendo los nuevos campos
    DROP VIEW IF EXISTS public.habits_with_streaks;
    CREATE OR REPLACE VIEW public.habits_with_streaks AS
    SELECT
      h.*,
      COALESCE(
        (
          SELECT COUNT(*)::INTEGER
          FROM (
            SELECT completed_date
            FROM public.habit_completions hc
            WHERE hc.habit_id = h.id
              AND hc.completed_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY completed_date DESC
          ) sub
          -- Streaks calculation placeholder: se sobreescribe con función real si existe
        ), 0
      ) AS current_streak,
      NULL::DATE AS streak_start
    FROM public.habits h
    WHERE h.is_active = TRUE AND h.is_archived = FALSE;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 4. Función helper: determinar si un hábito es "due" hoy
-- ─────────────────────────────────────────────────────────────
-- Útil para Edge Functions y queries futuras
CREATE OR REPLACE FUNCTION public.is_habit_due_today(
  p_frequency_type TEXT,
  p_frequency_days INTEGER,
  p_frequency_weekdays INTEGER[]
)
RETURNS BOOLEAN AS $$
DECLARE
  current_dow INTEGER; -- 0=Sunday, 1=Monday, ..., 6=Saturday
BEGIN
  current_dow := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;

  CASE p_frequency_type
    WHEN 'daily' THEN
      RETURN TRUE;
    WHEN 'weekly' THEN
      -- Si hay días específicos configurados, verificar
      IF p_frequency_weekdays IS NOT NULL AND array_length(p_frequency_weekdays, 1) > 0 THEN
        RETURN current_dow = ANY(p_frequency_weekdays);
      END IF;
      -- Sin configuración específica: todos los días (comportamiento de fallback)
      RETURN TRUE;
    WHEN 'custom' THEN
      -- N veces por semana: la lógica de distribución óptima se maneja en el cliente
      RETURN TRUE;
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
