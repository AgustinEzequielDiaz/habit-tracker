-- ─────────────────────────────────────────────────────────────
-- V7: Tabla ai_insights — caché de sugerencias IA por usuario/día
-- ─────────────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor

-- Tabla principal
CREATE TABLE IF NOT EXISTS ai_insights (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  insights       JSONB       NOT NULL DEFAULT '[]',
  model          TEXT        NOT NULL DEFAULT 'gpt-4o-mini',
  tokens_used    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un insight por usuario por día (el Edge Function hace upsert)
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_user_date_idx
  ON ai_insights (user_id, generated_date);

-- Índice para limpiezas periódicas (purgar entradas antiguas)
CREATE INDEX IF NOT EXISTS ai_insights_date_idx
  ON ai_insights (generated_date);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_ai_insights_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_ai_insights_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- SELECT: solo los propios
CREATE POLICY "ai_insights_select_own"
  ON ai_insights FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: solo los propios (el cliente no inserta directamente,
--         pero lo permitimos por si acaso; el Edge Function usa service_role)
CREATE POLICY "ai_insights_insert_own"
  ON ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: solo los propios
CREATE POLICY "ai_insights_update_own"
  ON ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: solo los propios
CREATE POLICY "ai_insights_delete_own"
  ON ai_insights FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Limpieza automática: borrar insights de más de 90 días
-- (opcional, se puede correr como cron o manualmente)
-- ─────────────────────────────────────────────────────────────
-- DELETE FROM ai_insights WHERE generated_date < CURRENT_DATE - INTERVAL '90 days';
