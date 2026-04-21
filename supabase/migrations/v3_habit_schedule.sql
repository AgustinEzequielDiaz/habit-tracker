-- ============================================================
-- V3 Migration: Habit Scheduling (start_date + end_date)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columnas de programación al hábito
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date   DATE;

-- Constraint: end_date debe ser posterior o igual a start_date
ALTER TABLE public.habits
  ADD CONSTRAINT habits_dates_check
    CHECK (end_date IS NULL OR end_date >= start_date);

-- 2. Backfill: los hábitos existentes arrancan desde su fecha de creación
UPDATE public.habits
SET start_date = created_at::DATE
WHERE start_date = CURRENT_DATE AND created_at::DATE < CURRENT_DATE;

-- 3. Recrear la vista habits_with_streaks para incluir los nuevos campos
--    (en PostgreSQL, SELECT h.* no se actualiza automáticamente al agregar columnas)
CREATE OR REPLACE VIEW public.habits_with_streaks AS
SELECT
  h.*,
  COALESCE(hs.length_days, 0)  AS current_streak,
  hs.start_date                AS streak_start
FROM public.habits h
LEFT JOIN public.habit_streaks hs
  ON hs.habit_id = h.id AND hs.end_date IS NULL;

-- 4. Índice para queries de hábitos por rango de fechas
CREATE INDEX IF NOT EXISTS idx_habits_start_date
  ON public.habits (user_id, start_date)
  WHERE is_active = TRUE AND is_archived = FALSE;
