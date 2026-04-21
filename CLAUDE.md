# Habit Tracker — Contexto de Proyecto para Claude

> Este archivo se carga automáticamente al inicio de cada sesión. Contiene el estado actual del proyecto, las decisiones técnicas fijadas y las convenciones de desarrollo.

---

## ESTADO ACTUAL: V2.1 — Hábitos programados (start_date + end_date)

Leer `CONTEXT_V1.md` para el contexto completo de arquitectura, decisiones y flujos.

### Features implementados en V2.0 (2026-04-20)

#### 1. Gráficos de evolución semanal (`WeeklyChart`)
- `src/components/stats/WeeklyChart.tsx` — BarChart con react-native-gifted-charts
- Colores dinámicos por nivel de cumplimiento (vacío / parcial / normal / perfecto)
- Promedio semanal + indicador de tendencia (↑ En alza / → Estable / ↓ A la baja)
- Leyenda de colores y animación de entrada
- Integrado en `stats/index.tsx` como nueva sección "Últimos 7 días"

#### 2. Análisis de insights automáticos (`InsightsCard`)
- `src/components/stats/InsightsCard.tsx` — hasta 4 insights basados en datos reales
- Detecta: mejor día de la semana, peor día, tendencia semanal, hábito estrella, hábito que más falla, racha perfecta actual
- Se muestra solo si hay suficientes datos (summaries > 3 o completions > 0)
- Integrado en `stats/index.tsx` como nueva sección "Insights"

#### 3. Plantillas de hábitos (`HabitTemplatesModal`)
- `src/constants/habit-templates.ts` — 16 plantillas en 4 categorías (Fitness, Productividad, Bienestar, Rutinas)
- `src/components/habits/HabitTemplatesModal.tsx` — Modal full-screen con tabs de categoría
- Tap en plantilla → abre `HabitForm` pre-llenado con los valores de la plantilla
- Botón "✨ Plantillas" en header de pantalla Hábitos
- CTA de plantillas en empty state de Hábitos
- `habits/index.tsx` actualizado con modal de plantillas + prefill form

#### 4. Widget de motivación dinámica (`MotivationCard`)
- `src/components/ui/MotivationCard.tsx` — mensaje motivacional contextual
- 12+ mensajes distintos basados en: completions del día, racha activa, score global, hora del día
- Casos especiales: día perfecto, racha 7d+, score alto/bajo, tarde sin empezar
- Integrado en `today/index.tsx` encima de la lista de hábitos

#### 5. Streak Freeze (`StreakFreezeWidget`)
- `supabase/migrations/v2_streak_freeze.sql` — migración SQL opcional (no rompe V1 si no se ejecuta)
- `src/components/gamification/StreakFreezeWidget.tsx` — widget completo con tokens visuales
- Tokens: máx 5, se ganan cada 7 días de racha (trigger en DB)
- Usar 1 token → inserta freeze en `streak_freezes` para todas las rachas activas del día
- Integrado en `profile/index.tsx` entre XP y Logros
- `User` type actualizado con `streak_freeze_tokens: number`
- `StreakFreeze` type agregado a `types/index.ts`

#### 6. Hábitos programados — V2.1 (2026-04-20)
- `supabase/migrations/v3_habit_schedule.sql` — Agrega `start_date DATE DEFAULT CURRENT_DATE` y `end_date DATE` a `habits`; backfill; recrea vista `habits_with_streaks`
- `src/types/index.ts` — `start_date?` y `end_date?` opcionales en `Habit` y `CreateHabitForm`
- `src/services/habits.service.ts` — `create()` ahora persiste `start_date` y `end_date`
- `src/stores/habits.store.ts` — Tres buckets: `habits` (activos hoy), `upcomingHabits` (start > hoy), `expiredHabits` (end < hoy). Filtrado client-side, retrocompatible sin migración.
- `src/components/ui/HabitSchedulePicker.tsx` — Selector visual sin dependencias nuevas: chips de presets + stepper +/− para días custom. Start date: Hoy / Mañana / +7d / +14d / Elegir. Duración: 7 / 21 / 30 / 66 / 90 / Elegir días
- `src/components/habits/HabitForm.tsx` — Sección "Programar" colapsable con resumen en el botón (ej: "Mañana · 30 días"). Pre-opens si el initialValues tiene fechas configuradas
- `src/components/habits/HabitCard.tsx` — Badge "Quedan Xd" (amarillo ≤7d, rojo ≤3d, verde = ¡Hoy!)
- `src/app/(main)/habits/index.tsx` — SectionList con 3 secciones: Activos / Próximos / Challenges completados

### Fixes aplicados en auditoría V1.2 (2026-04-20)
- `_layout.tsx` — `splashFallback` movido dentro de `useEffect`
- `register.tsx` — pantalla "Revisá tu email" cuando Supabase requiere confirmación
- `notifications.service.ts` — `getExpoPushTokenAsync` con `projectId` + try/catch robusto
- `profile/index.tsx` — `useEffect` dep `user?.id`
- `today/index.tsx` — `useCallback` y deps correctas
- `stats/index.tsx` — `loadAll` wrapped en `useCallback`
- TypeScript: `npm run type-check` pasa con 0 errores

---

## STACK

React Native + Expo (~52) · Expo Router · Zustand · Supabase (PostgreSQL + Auth + Edge Functions) · TypeScript · React Native Reanimated 3 · react-native-gifted-charts · date-fns · AsyncStorage (offline queue)

## ESTRUCTURA CLAVE

```
src/
├── app/          # Expo Router: (auth)/, onboarding/, (main)/
├── components/
│   ├── habits/   # HabitCard, HabitForm, HabitTemplatesModal, StreakBadge
│   ├── stats/    # HeatmapGrid, ScoreRing, WeeklyChart, InsightsCard ← NUEVO V2
│   ├── gamification/ # XPProgressBar, AchievementCard, StreakFreezeWidget ← NUEVO V2
│   └── ui/       # Button, Card, MotivationCard ← NUEVO V2
├── stores/       # user, habits, completions, sync (Zustand)
├── services/     # supabase, habits, completions, notifications
├── hooks/        # useTheme, useSync
├── utils/        # date, scoring, offline-queue
├── constants/    # theme (dark/light), achievements, habit-templates ← NUEVO V2
└── types/        # index.ts (User, Habit, StreakFreeze ← NUEVO V2)

supabase/
├── schema.sql        ← ejecutar primero (V1)
├── rls.sql           ← ejecutar segundo (V1)
├── migrations/
│   └── v2_streak_freeze.sql  ← ejecutar para activar streak freeze
└── functions/        ← calculate-daily-score, sync-offline-queue, send-reminders
```

---

## CONVENCIONES DE CÓDIGO

- **Imports:** usar alias `@/` en lugar de rutas relativas (ej: `@/stores/habits.store`)
- **Temas:** siempre usar `useTheme()` para colores, nunca hardcodear colores
- **Stores:** acceder con hooks de Zustand, nunca importar el store directo en componentes
- **Fechas:** siempre usar `todayString()` de `@/utils/date` para la fecha actual
- **Optimistic updates:** todas las acciones del usuario deben actualizar la UI antes de la red
- **Errores de Supabase:** usar `handleSupabaseError()` de `@/services/supabase`
- **Estilos:** StyleSheet.create() siempre, nunca estilos inline en el render
- **Offline:** antes de llamar a Supabase, verificar `useSyncStore().isOnline`

---

## DECISIONES FIJADAS (no cambiar sin discutir)

| Tema | Decisión |
|------|----------|
| Offline | Cola AsyncStorage, no WatermelonDB |
| Scoring | Reglas de negocio, no ML |
| Streaks | Por hábito, con gracia hasta 23:59 |
| Hábitos | Solo frecuencia diaria en V1/V2 |
| Heatmap | Global (todos los hábitos) |
| Social | No en V1/V2 |
| IA | No en V1/V2 |
| Monetización | Free en V1/V2, preparado para freemium |
| Gráficos | react-native-gifted-charts (ya instalado) |
| Streak Freeze | Requiere migration v2_streak_freeze.sql |

---

## VARIABLES DE ENTORNO

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_API_KEY=
```

GitHub Secrets para cron: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## COMANDOS RÁPIDOS

```bash
npm start                    # Dev server
npm run type-check           # TypeScript check (debe pasar 0 errores)

# Supabase
supabase functions deploy calculate-daily-score
supabase functions deploy sync-offline-queue
supabase functions deploy send-reminders

# EAS Build
eas build --profile development --platform ios
eas build --profile production --platform all
```

---

## CHECKLIST PARA PRIMERA PRUEBA (V2.1 — Hábitos programados)

- [ ] **Migración V3** → `supabase/migrations/v3_habit_schedule.sql` en SQL Editor
- [ ] **Flujos a testear:**
  1. Crear hábito → expandir "Programar" → elegir inicio "Mañana" → verificar que NO aparece en Hoy
  2. Crear hábito con duración 30d → verificar sección "Activos" y badge "30d restantes" en Hábitos
  3. Verificar sección "Próximos" en tab Hábitos para hábitos futuros
  4. Crear hábito con duración 7d, esperar a que venza → aparece en "Challenges completados"

## CHECKLIST PARA PRIMERA PRUEBA (V2)

- [ ] **1. Migración V2** (opcional para streak freeze) → `supabase/migrations/v2_streak_freeze.sql`
- [ ] **2. Verificar dependencias** → `npm install` (gifted-charts ya en package.json)
- [ ] **3. Flujos a testear:**
  1. Crear hábito desde plantilla (✨ Plantillas en tab Hábitos)
  2. Ver gráfico semanal en Stats (barra de colores)
  3. Ver insights en Stats (cards con análisis)
  4. Ver tarjeta motivacional en pantalla Hoy
  5. Ver widget de Streak Freeze en Perfil (requiere migración SQL)

---

## PRÓXIMOS PASOS (V3)

1. Hábitos medibles (tipo ya en DB, `value` en `toggleCompletion`, falta UI de input numérico)
2. Frecuencias no diarias (semanal / N veces por semana — requiere schema changes)
3. Micro-hábitos (sub-hábitos con lógica de anclaje)
4. Notificaciones con timing dinámico (aprender horario del usuario)
5. Correlaciones simples entre hábitos (comparar completions de dos hábitos)
6. Detección de riesgo de abandono (caída de frecuencia → alerta)
7. Mood tracking + relación con completions
8. Journal integrado
9. Vista de agenda semanal

---

## VERSIONES

| Versión | Estado | Descripción |
|---------|--------|-------------|
| V1 | ✅ Completo | MVP: registro, dashboard, streaks, heatmap, gamificación, auth, onboarding |
| V2 | ✅ Completo | Gráficos semanales, insights automáticos, plantillas, motivación, streak freeze |
| V3 | 🔜 Próximo | Hábitos medibles, frecuencias, micro-hábitos, notificaciones dinámicas |
| V4 | 📋 Planificado | Correlaciones, riesgo abandono, mood, journal, social básico |
| V5 | 💡 Futuro | IA, grupos, integraciones, versión web |
