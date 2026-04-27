-- ============================================================
-- V6 Migration: Journal Entries
-- Persiste las notas diarias del usuario en Supabase.
-- Antes solo se guardaban en AsyncStorage del dispositivo.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla journal_entries
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date    DATE NOT NULL,
  text          TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 2000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una entrada por día por usuario
  CONSTRAINT journal_entries_unique_per_day UNIQUE (user_id, entry_date)
);

-- ─────────────────────────────────────────────────────────────
-- 2. Índices
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
  ON public.journal_entries (user_id, entry_date DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. Trigger: auto-update updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_updated_at ON public.journal_entries;
CREATE TRIGGER trg_journal_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_journal_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal: select own"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal: insert own"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal: update own"  ON public.journal_entries;
DROP POLICY IF EXISTS "journal: delete own"  ON public.journal_entries;

-- Solo el propio usuario puede leer sus entradas
CREATE POLICY "journal: select own"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Solo puede insertar entradas propias
CREATE POLICY "journal: insert own"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo puede actualizar sus propias entradas
CREATE POLICY "journal: update own"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo puede eliminar sus propias entradas
CREATE POLICY "journal: delete own"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);
