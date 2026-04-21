-- ============================================================
-- V2 Migration: Streak Freeze System
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar tokens de freeze al perfil de usuario
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS streak_freeze_tokens SMALLINT NOT NULL DEFAULT 0 CHECK (streak_freeze_tokens >= 0);

-- 2. Tabla de historial de freezes usados
CREATE TABLE IF NOT EXISTS public.streak_freezes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id      UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  freeze_date   DATE NOT NULL,           -- el día que se protegió
  used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, habit_id, freeze_date)
);

-- 3. RLS para streak_freezes
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own freezes"
  ON public.streak_freezes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own freezes"
  ON public.streak_freezes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Índice para consultas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_streak_freezes_user_id
  ON public.streak_freezes (user_id, freeze_date DESC);

-- 5. Trigger: otorgar 1 token cada vez que streak_best sube a múltiplo de 7
CREATE OR REPLACE FUNCTION public.award_freeze_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Si streak_best subió y es múltiplo de 7, otorgar un token
  IF NEW.streak_best > OLD.streak_best AND NEW.streak_best % 7 = 0 THEN
    NEW.streak_freeze_tokens = LEAST(NEW.streak_freeze_tokens + 1, 5); -- máx 5 tokens
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_streak_best_updated
  BEFORE UPDATE OF streak_best ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.award_freeze_token();
