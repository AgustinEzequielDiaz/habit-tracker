-- ============================================================
-- HABIT TRACKER — Schema completo
-- Ejecutar en Supabase SQL Editor en este orden
-- ============================================================

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE habit_category AS ENUM (
  'fitness',
  'productividad',
  'bienestar',
  'rutinas'
);

CREATE TYPE habit_type AS ENUM (
  'binary',
  'measurable',
  'timed'
);

CREATE TYPE habit_difficulty AS ENUM (
  'easy',
  'normal',
  'hard'
);

CREATE TYPE completion_source AS ENUM (
  'manual',
  'offline_sync'
);

-- ─────────────────────────────────────────
-- USERS (extiende auth.users de Supabase)
-- ─────────────────────────────────────────

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  level         SMALLINT NOT NULL DEFAULT 1 CHECK (level >= 1),
  total_xp      INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  global_score  DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (global_score >= 0 AND global_score <= 100),
  streak_best   SMALLINT NOT NULL DEFAULT 0 CHECK (streak_best >= 0),
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────

CREATE TABLE public.habits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description   TEXT CHECK (char_length(description) <= 500),
  category      habit_category NOT NULL DEFAULT 'rutinas',
  type          habit_type NOT NULL DEFAULT 'binary',
  difficulty    habit_difficulty NOT NULL DEFAULT 'normal',
  target_value  DECIMAL(8,2) CHECK (target_value > 0),
  unit          TEXT CHECK (char_length(unit) <= 30),
  color         TEXT NOT NULL DEFAULT '#6366F1',
  icon          TEXT NOT NULL DEFAULT 'star',
  order_index   SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- HABIT COMPLETIONS
-- ─────────────────────────────────────────

CREATE TABLE public.habit_completions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id       UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value          DECIMAL(8,2) CHECK (value >= 0),
  note           TEXT CHECK (char_length(note) <= 300),
  source         completion_source NOT NULL DEFAULT 'manual',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(habit_id, user_id, completed_date)
);

-- ─────────────────────────────────────────
-- HABIT STREAKS
-- ─────────────────────────────────────────

CREATE TABLE public.habit_streaks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date   DATE NOT NULL,
  end_date     DATE,
  length_days  SMALLINT NOT NULL DEFAULT 1 CHECK (length_days >= 1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DAILY SUMMARIES (pre-calculado por cron)
-- ─────────────────────────────────────────

CREATE TABLE public.daily_summaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  summary_date      DATE NOT NULL,
  habits_total      SMALLINT NOT NULL DEFAULT 0,
  habits_completed  SMALLINT NOT NULL DEFAULT 0,
  completion_rate   DECIMAL(5,2) NOT NULL DEFAULT 0,
  global_score      DECIMAL(5,2) NOT NULL DEFAULT 0,
  xp_earned         SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

-- ─────────────────────────────────────────
-- NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────

CREATE TABLE public.notification_prefs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  enabled              BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time        TIME NOT NULL DEFAULT '09:00:00',
  ignored_count        SMALLINT NOT NULL DEFAULT 0 CHECK (ignored_count >= 0),
  last_interaction_at  TIMESTAMPTZ,
  push_token           TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- USER ACHIEVEMENTS
-- ─────────────────────────────────────────

CREATE TABLE public.user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, achievement_key)
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────

-- Daily summaries: heatmap query (más frecuente)
CREATE INDEX idx_daily_summaries_user_date
  ON public.daily_summaries(user_id, summary_date DESC);

-- Hábitos activos del usuario (Today screen)
CREATE INDEX idx_habits_user_active
  ON public.habits(user_id, order_index)
  WHERE is_active = TRUE AND is_archived = FALSE;

-- Completions por usuario y fecha
CREATE INDEX idx_completions_user_date
  ON public.habit_completions(user_id, completed_date DESC);

-- Completions por hábito (gráfico individual)
CREATE INDEX idx_completions_habit_date
  ON public.habit_completions(habit_id, completed_date DESC);

-- Racha activa de un hábito
CREATE INDEX idx_streaks_habit_active
  ON public.habit_streaks(habit_id)
  WHERE end_date IS NULL;

-- ─────────────────────────────────────────
-- VIEWS útiles
-- ─────────────────────────────────────────

-- Vista: hábitos con racha activa del usuario
CREATE OR REPLACE VIEW public.habits_with_streaks AS
SELECT
  h.*,
  COALESCE(hs.length_days, 0) AS current_streak,
  hs.start_date AS streak_start
FROM public.habits h
LEFT JOIN public.habit_streaks hs
  ON hs.habit_id = h.id AND hs.end_date IS NULL;
