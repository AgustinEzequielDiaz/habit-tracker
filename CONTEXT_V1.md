# Habit Tracker — Contexto Completo del Proyecto (V1)

> Este archivo es el prompt maestro del proyecto. Contiene todo el historial de decisiones, la arquitectura, el stack y el estado actual del código. Usarlo al inicio de cada nueva sesión de trabajo para retomar el contexto completo.

---

## ROL DEL ASISTENTE

Actuás como un Software Engineer Senior / Staff Engineer con más de 8 años de experiencia en productos mobile-first. Tu expertise cubre arquitectura de software, frontend mobile UX/UI, modelado de datos, diseño de APIs, producto digital orientado a engagement y retención, y tecnologías como React Native, Expo, Supabase, TypeScript y Zustand.

---

## QUÉ ES EL PRODUCTO

Una app de seguimiento de hábitos mobile-first con inteligencia incorporada. No es un tracker simple: es un sistema que aprende del comportamiento del usuario, genera insights, adapta la dificultad, gamifica el progreso y eventualmente incorpora funcionalidad social.

**Problema que resuelve:** el usuario no logra sostener hábitos por falta de consistencia, baja motivación a largo plazo, falta de visibilidad del progreso y fricción alta para registrar.

**Diferencial:** no solo tracking → insights inteligentes, UX extremadamente rápida (1–2 taps), visualización clara no sobrecargada, adaptación al usuario (dificultad dinámica), sistema de motivación sin saturación.

---

## USUARIO OBJETIVO

- Edad: 18–45
- Perfil: estudiantes, profesionales, personas con interés en mejora personal
- Tech: nivel medio (usan apps pero no quieren complejidad)
- Objetivos: productividad, fitness, bienestar mental, rutinas diarias
- Insight clave: el usuario quiere mejorar pero no quiere dedicar tiempo a la app

---

## STACK TECNOLÓGICO (DEFINITIVO)

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Mobile | React Native + Expo (managed workflow) | Expo ~52 |
| Navegación | Expo Router (file-based) | ~4.0 |
| Estado global | Zustand | ^5.0 |
| Backend/DB | Supabase (PostgreSQL + Auth + Edge Functions) | ^2.47 |
| Auth | Supabase Auth (Email + Google + Apple) | — |
| Notificaciones | Expo Notifications (abstrae FCM + APNs) | ~0.29 |
| Analytics | PostHog | — |
| Animaciones | React Native Reanimated 3 | ~3.16 |
| Gráficos | react-native-gifted-charts | ^1.4 |
| Fechas | date-fns | ^4.1 |
| Offline queue | AsyncStorage + cola manual | — |
| Cron jobs | GitHub Actions → Supabase Edge Functions | — |
| CI/CD | GitHub Actions + Expo EAS | — |

---

## ARQUITECTURA

**Patrón:** Monolito modular (no microservicios).

**Offline-first:** Cola de operaciones en AsyncStorage. Al recuperar conexión, se llama a la Edge Function `sync-offline-queue` que aplica las operaciones en orden cronológico con UPSERT (sin conflictos).

**Jobs programados (GitHub Actions):**
- `calculate-daily-score` → todos los días a las 00:05 UTC
- `send-reminders` → cada hora

**Seguridad:** Row Level Security activado en todas las tablas. Ningún usuario puede ver datos de otro.

---

## BASE DE DATOS (Supabase / PostgreSQL)

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `users` | Extiende auth.users. Tiene level, total_xp, global_score, streak_best |
| `habits` | Definición de hábitos. Tiene category, type, difficulty, color, icon |
| `habit_completions` | Historial completo de completions. UNIQUE por (habit_id, user_id, completed_date) |
| `habit_streaks` | Rachas por hábito. end_date NULL = racha activa |
| `daily_summaries` | Pre-calculado por cron. Heatmap y stats del dashboard |
| `notification_prefs` | Preferencias de notificación por usuario. Tiene ignored_count para anti-fatiga |
| `user_achievements` | Logros desbloqueados |

### Enums definidos
- `habit_category`: fitness, productividad, bienestar, rutinas
- `habit_type`: binary, measurable, timed
- `habit_difficulty`: easy, normal, hard
- `completion_source`: manual, offline_sync

### Vista útil
- `habits_with_streaks`: hábitos con su racha activa actual (JOIN con habit_streaks WHERE end_date IS NULL)

### Archivos SQL
- `supabase/schema.sql` → ejecutar primero
- `supabase/rls.sql` → ejecutar después

---

## ALGORITMO DE SCORING (reglas de negocio, sin ML)

```typescript
// Score por hábito (0-100)
completionRate = completions_últimos_30d / 30
gapPenalty = max(0, (max_consecutive_gap - 3) * 0.05)
regularityFactor = max(0.5, 1 - gapPenalty)
diffWeight = { easy: 0.8, normal: 1.0, hard: 1.3 }

habitScore = min(100, completionRate * regularityFactor * diffWeight * 100)

// Score global = promedio ponderado por dificultad
globalScore = sum(habitScore * diffWeight) / sum(diffWeight)
```

**XP por día:**
- 100% completado → 100 XP
- 80-99% → 60 XP
- 50-79% → 30 XP
- < 50% → 10 XP

---

## ESTRUCTURA DE CARPETAS

```
src/
├── app/
│   ├── _layout.tsx              ← Root: listener auth + sync
│   ├── (auth)/                  ← Welcome, Login, Register
│   ├── onboarding/              ← 3 pasos: bienvenida, hábito, notificaciones
│   └── (main)/                  ← Tabs: today, habits, stats, profile
├── components/
│   ├── habits/                  ← HabitCard, HabitCheckbox, StreakBadge, HabitForm
│   ├── stats/                   ← ScoreRing, HeatmapGrid
│   ├── gamification/            ← XPProgressBar, AchievementCard
│   └── ui/                      ← Button, Card
├── stores/
│   ├── user.store.ts            ← Perfil, nivel, XP
│   ├── habits.store.ts          ← CRUD hábitos
│   ├── completions.store.ts     ← Completions del día + optimistic update
│   └── sync.store.ts            ← Estado de red + sync offline
├── services/
│   ├── supabase.ts              ← Cliente Supabase
│   ├── habits.service.ts
│   ├── completions.service.ts
│   └── notifications.service.ts
├── hooks/
│   ├── useTheme.ts              ← Dark/light mode automático
│   └── useSync.ts               ← Listener de red + sync
├── utils/
│   ├── date.ts                  ← Helpers de fechas con date-fns
│   ├── scoring.ts               ← Algoritmo de score
│   └── offline-queue.ts         ← Cola offline en AsyncStorage
├── constants/
│   ├── theme.ts                 ← Colores, spacing, tipografía, dark/light
│   └── achievements.ts          ← Definición de logros, niveles, XP thresholds
└── types/
    └── index.ts                 ← Todos los tipos TypeScript

supabase/
├── schema.sql
├── rls.sql
└── functions/
    ├── calculate-daily-score/index.ts
    ├── sync-offline-queue/index.ts
    └── send-reminders/index.ts
```

---

## FLUJOS CRÍTICOS

### 1. Completar un hábito (el más importante)
1. Usuario toca HabitCard → HabitCheckbox
2. Animación de feedback + haptic inmediato
3. Optimistic update en Zustand (UI actualiza antes de la red)
4. ¿Online? → POST a Supabase. ¿Offline? → enqueue en AsyncStorage
5. Al reconectar → sync automático vía Edge Function

### 2. Score diario (cron)
1. GitHub Actions dispara a las 00:05 UTC
2. Edge Function `calculate-daily-score` procesa todos los usuarios
3. Calcula habitScore y globalScore
4. UPSERT en daily_summaries
5. Actualiza streaks (extiende o cierra)
6. Evalúa achievements
7. Actualiza users.global_score, total_xp, level

### 3. Navegación / Auth
- Sin sesión → (auth) stack
- Con sesión + onboarding incompleto → /onboarding
- Con sesión + onboarding completo → (main) tabs

---

## ESTADO DEL MVP (V1 — completado)

### Implementado ✅
- Registro de hábitos (tipo binary en MVP; measurable/timed definidos en tipos pero no en UI todavía)
- Dashboard diario (Today screen) con ScoreRing, progreso del día, lista de hábitos
- Completions con optimistic update + offline queue
- Streak tracking por hábito
- Heatmap de actividad (365 días)
- Gamificación: XP, niveles (10 niveles), 15 logros definidos
- Onboarding de 3 pasos
- Auth: email/password + Google + Apple (estructura)
- Dark mode automático (sistema)
- Profile screen con logros y XP bar
- Stats screen con heatmap + métricas 30 días
- Row Level Security en todas las tablas
- 3 Edge Functions: score diario, sync offline, recordatorios
- GitHub Actions para cron jobs
- Anti-fatiga de notificaciones (ignored_count)

### No implementado en V1 (V2+)
- Hábitos medibles y temporales (tipos definidos, UI pendiente)
- Gráficos de evolución temporal (Victory/Gifted Charts pendiente de integrar)
- Notificaciones con timing dinámico (ML)
- Micro-hábitos
- Plantillas de hábitos
- Frecuencia no diaria (semanal / N veces por semana)
- Correlaciones entre hábitos
- Riesgo de abandono
- Ajuste automático de dificultad
- Mood tracking
- Journal diario
- Social (grupos, buddies, leaderboards)
- IA / LLM assistant
- Integración con calendario externo
- Versión web

---

## DECISIONES TÉCNICAS FIJADAS

| Decisión | Elección | Razón |
|----------|----------|-------|
| Offline-first | Cola AsyncStorage (no WatermelonDB) | Simple, cubre el 99% del caso real |
| Scoring | Reglas de negocio (no ML) | Predecible, debuggeable, sin infra extra |
| Streaks | Por hábito individual, gracia hasta las 23:59 | Más justo y motivante que global |
| Streak freeze | No en V1 | Entra en V2 |
| Monetización | Free en MVP, preparado para freemium | Primero validar retención |
| Categorías | Enum fijo en V1 (fitness/productividad/bienestar/rutinas) | Bajo costo, alta UX |
| Frecuencia | Solo diaria en V1 | Lógica semanal multiplica complejidad del score |
| Heatmap | Global (todos los hábitos) en V1 | Más impactante, más rápido de implementar |
| Scheduler | GitHub Actions + Edge Functions | Gratis, sin infra extra |
| IA | No en V1 | Entra en V2 cuando hay datos reales |
| Social | No en V1 | Entra en V2 |

---

## NIVELES Y XP

```typescript
LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
LEVEL_NAMES = ['Principiante', 'En camino', 'Constante', 'Disciplinado', 'Enfocado',
               'Avanzado', 'Experto', 'Maestro', 'Élite', 'Leyenda']
```

---

## LOGROS DEFINIDOS (15 en total)

`first_habit`, `first_completion`, `streak_3`, `streak_7`, `streak_30`,
`perfect_day`, `perfect_week`, `score_70`, `score_90`, `habits_3`, `habits_5`,
`days_7`, `days_30`

---

## COMANDOS CLAVE

```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Ejecutar schema en Supabase (SQL Editor)
# 1. supabase/schema.sql
# 2. supabase/rls.sql

# Deploy Edge Functions
supabase functions deploy calculate-daily-score
supabase functions deploy sync-offline-queue
supabase functions deploy send-reminders

# Build producción
eas build --profile production --platform all
```

---

## VARIABLES DE ENTORNO NECESARIAS

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_API_KEY=   # opcional en V1
```

**GitHub Secrets para cron:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## PRÓXIMOS PASOS SUGERIDOS PARA V2

1. Instalar y levantar la app en dispositivo físico
2. Ejecutar schema.sql + rls.sql en Supabase
3. Testear el flujo completo: registro → onboarding → completar hábitos → ver stats
4. Ajustar UX según feedback real
5. Implementar gráficos de evolución temporal (react-native-gifted-charts ya instalado)
6. Implementar hábitos medibles (el tipo ya está en DB y types, falta UI)
7. Agregar frecuencias no diarias
8. Configurar notificaciones en dispositivo físico (requiere EAS build)
9. Implementar micro-hábitos
10. Plantillas de hábitos pre-cargadas

---

*Versión: 1.0 — Fecha: 2026-04-18*
*Estado: MVP completo, listo para testear en dispositivo*
