# Habit Tracker — Contexto de Proyecto para Claude

> Este archivo se carga automáticamente al inicio de cada sesión. Contiene el estado actual del proyecto, las decisiones técnicas fijadas y las convenciones de desarrollo.

---

## ESTADO ACTUAL: V5.0 — Frecuencias no-diarias + ShareCard Carousel

Leer `CONTEXT_V1.md` para el contexto completo de arquitectura, decisiones y flujos.

### Features implementados en V5.0 (2026-04-23)

#### 1. Frecuencias no-diarias (weekly + custom weekdays)
- **`src/types/index.ts`** — `FrequencyType = 'daily' | 'weekly' | 'custom'`. `Habit` y `CreateHabitForm` tienen `frequency_type?`, `frequency_days?`, `frequency_weekdays?`. `HabitWithCompletion` tiene `weeklyProgress?` y `weeklyTarget?`.
- **`src/utils/frequency.ts`** — Módulo nuevo:
  - `getFrequencyLabel(habit)` → `null` (daily), `"3×/sem"` (weekly), `"L, X, V"` / `"4d/sem"` (custom)
  - `isHabitDueToday(habit)` → false para hábitos custom en días que no corresponden
  - `getWeekStart()` → lunes de la semana actual (YYYY-MM-DD)
  - `getWeeklyCompletionCount(habitId, completions)` → completions desde lunes hasta hoy
  - `isWeeklyHabitSatisfied(habit, completions)` → count >= target
- **`src/stores/habits.store.ts`** — `filterTodayHabits` llama `isHabitDueToday(h)` para filtrar hábitos custom que no son hoy
- **`src/stores/completions.store.ts`** — `habitsWithCompletions()` maneja hábitos weekly: `weekCount >= target` determina `isCompleted`. Devuelve `weeklyProgress` + `weeklyTarget`. `completedTodayCount()` y `todayCompletionRate()` usan `habitsWithCompletions()`.
- **`src/services/habits.service.ts`** — `create()` persiste `frequency_type`, `frequency_days`, `frequency_weekdays` con fallback graceful si la migración v5 no fue ejecutada.
- **`src/components/habits/HabitForm.tsx`** — Sección colapsable "🔁 Frecuencia":
  - 3 chips de tipo: 📅 Diaria / 📆 X/semana / 🗓 Días fijos
  - Weekly: stepper − / + para cantidad de días (1-6 veces por semana)
  - Custom: chips de días L M X J V S D (seleccionables, orden Lun→Dom)
  - `frequencySummary` en el botón colapsable (ej: "3×/sem" o "L, M, X")
- **`src/components/habits/HabitCard.tsx`** — Badge de frecuencia (`freqLabel` como pill de color) + progreso semanal ("2/3 esta sem." / "✓ esta sem.") para hábitos weekly.

#### 2. Carrusel de 5 temas para ShareCard
- **`src/components/profile/ShareCard.tsx`** — Refactorizado con sistema de temas:
  - `ShareCardThemeId = 'violet' | 'emerald' | 'sunset' | 'ocean' | 'rose'`
  - `SHARE_THEMES: ShareCardTheme[]` — 5 temas con gradientes, glow, accentos, colores de heatmap individuales
  - `ShareCard` acepta `theme?: ShareCardTheme` (default: Violet Dark)
  - `ScoreRingSvg` y `HeatmapRow` usan colores del tema. IDs de SVG únicos por tema para evitar conflictos.
- **`src/components/profile/SharePreviewModal.tsx`** — Reescrito con carrusel:
  - `ScrollView horizontal pagingEnabled` con refs por tema
  - `cardRefs.current[]` — array de ViewShot refs, uno por tema
  - Dots + nombre del tema debajo del carrusel (píldora activa, puntos inactivos)
  - Al tocar un dot: `scrollTo()` para navegar
  - Botón "Compartir" adapta color de `activeTheme.accentTo`
  - Share captura el ViewShot del índice activo

### Features implementados en V4.1 (2026-04-23)

#### 1. Rediseño del Journal
- **JournalCard** `src/components/ui/JournalCard.tsx`: card siempre visible en Today. Estado vacío: prompt italic "Tocá para escribir algo de hoy →". Con contenido: preview del texto con borde izquierdo del color primary, badge "Editar".
- **JournalSheet** `src/components/ui/JournalSheet.tsx`: bottom sheet 82% de pantalla. Header con fecha, prompt del día rotativo (uno por día de la semana), textarea con auto-save, historial de los últimos 3 días. Reemplaza `DailyJournalWidget`.
- **today/index.tsx** actualizado: `JournalCard` + `JournalSheet` reemplazan `DailyJournalWidget`. Estado `journalOpen` controla el sheet.

#### 2. Botón Flotante (FAB)
- **FloatingActionButton** `src/components/ui/FloatingActionButton.tsx`: círculo 56dp, posicionado bottom-right, spring entrance animation, haptic feedback en cada press, icono cambia según acción configurada.
- **QuickCompleteSheet** `src/components/habits/QuickCompleteSheet.tsx`: bottom sheet con lista de hábitos del día. Pendientes primero, completados al final. Check animado con spring + haptic al completar. Auto-cierre con celebración cuando se completan todos.
- **settings.store.ts** actualizado: `fabAction: FabAction` persistido. Tipo exportado `FabAction = 'quick_complete' | 'new_habit' | 'log_mood' | 'write_note'`. Default: `'quick_complete'`.
- **_layout.tsx** actualizado: envuelve `<Tabs>` en `<View>`, renderiza `<FloatingActionButton>`, `<QuickCompleteSheet>`, `<JournalSheet>` como overlays persistentes.
- **settings/index.tsx** actualizado: sección "Botón flotante (FAB)" con 4 opciones seleccionables. Versión bumped a '4.1.0'.

#### 3. Tarjeta Visual para Redes Sociales
- **ShareCard** `src/components/profile/ShareCard.tsx`: tarjeta 360×540px con fondo degradado dark violet (SVG), score ring animado, heatmap semanal con colores por tasa de completions, stats (racha, hábitos, %), avatar, nivel, branding.
- **SharePreviewModal** `src/components/profile/SharePreviewModal.tsx`: modal full-screen sobre fondo oscuro. Preview de la tarjeta escalada. Botón "Compartir imagen" (captura con `react-native-view-shot` → `expo-sharing`) con fallback a texto rico si las librerías no están instaladas.
- **profile/index.tsx** actualizado: botón 🔗 abre `SharePreviewModal` en lugar del share de texto. `shareCardData` calculado vía `useMemo`.
- **package.json** actualizado: `react-native-view-shot ^3.8.0` + `expo-sharing ~13.0.0` agregados (requieren `npm install`).

### Features implementados en V4.0 (2026-04-22)

#### 1. Agenda Semanal
- **Nueva pantalla** `src/app/(main)/agenda/index.tsx` con tab 📅 en el bottom bar.
- Vista de 7 días (lunes a domingo) con nav prev/next semana y botón "Ir a hoy".
- Cada columna: nombre del día, número, mini-barra de progreso circular, fracción completados/total.
- Los hábitos se muestran como chips de color: lleno = completado, vacío = pendiente.
- Card de resumen semanal: % cumplimiento, total completados, días activos + barra de progreso.
- Leyenda de hábitos debajo del grid.

#### 2. Journal + Notas Diarias
- **DailyJournalWidget** `src/components/ui/DailyJournalWidget.tsx`: widget colapsable en Today screen (entre MoodPicker y la lista). Textarea de 300 chars con auto-save al blur.
- **journal.store.ts** `src/stores/journal.store.ts`: Zustand + AsyncStorage (`@habit_tracker_journal_v1`). Historial completo, `getEntryForDate()`.
- **HabitDetailSheet**: soporte para nota por completion (prop `onAddNote?`). Muestra la nota guardada de la completion actual.

#### 3. Notificaciones Dinámicas con Smart Timing
- **notificationsService.analyzeOptimalTime(completions)** — calcula la mediana de horas de completions recientes. Requiere ≥5 datos.
- **notificationsService.scheduleDailyReminder(time, name)** — programa notificación local diaria a la hora indicada con mensajes variados.
- **notificationsService.shouldUpdateTime()** — retorna true si el horario sugerido difiere >30 min del actual.
- **notificationsService.incrementIgnoredCount()** — anti-fatiga en DB.
- **Settings screen**: nueva sección con switch de notificaciones, horario actual, botón "Analizar 🧠" que detecta el horario óptimo y propone activarlo. Badge "✨ Horario aprendido" al detectar.

#### 4. Compartir Progreso
- **Botón 🔗** en Profile screen (junto a ⚙️).
- Genera texto rico con: nivel, score, racha, heatmap de últimos 7 días (✅🟨⬜), completions del día.
- Comparte via React Native `Share.share()` nativo (iOS sheet / Android intent).

### Features implementados en V3.0 (2026-04-22)

#### 1. Hábitos Medibles y Temporales
- **HabitForm** — Selector de tipo (Hecho/No hecho, Medible, Por tiempo). Para Medible: campo `target_value` + `unit` con sugerencias por categoría. Para Timed: solo duración en minutos.
- **ValueInputModal** — `src/components/habits/ValueInputModal.tsx`: bottom sheet al completar hábito medible. Input numérico grande + presets inteligentes (25%, 50%, 75%, 100%, 125% del target). Barra de progreso visual en tiempo real. Botón "Solo marcar ✓" para completar sin valor.
- **HabitCard** — Muestra fracción `actual/meta unidad` debajo del nombre. Barra de progreso de color debajo del texto (animada cuando hay valor). Para hábitos medibles, el tap del checkbox abre ValueInputModal en lugar de toggle directo.
- Stores: `toggleCompletion` ya soportaba `value?: number`, sin cambios en el store.

#### 2. Mood Tracking (Estado de Ánimo Diario)
- **MoodPicker** — `src/components/ui/MoodPicker.tsx`: widget en pantalla Hoy con 5 niveles (😫😕😐😊🤩). Animación de escala al seleccionar. Badge con el mood actual cuando está seleccionado.
- **mood.store.ts** — `src/stores/mood.store.ts`: Zustand store con AsyncStorage persistence (`@habit_tracker_mood_v1`). Persiste historial de 30+ días, `todayMood`, `getAverageMoodLast7Days()`.
- Integrado en Today screen entre MotivationCard y la lista de hábitos.

#### 3. Detección de Riesgo de Abandono
- **InsightsCard mejorado** — Insight `🚨 Riesgo de abandono`: detecta hábitos con 0 completions en los últimos 7 días. Si es 1 hábito: muestra nombre. Si son múltiples: count + nombres. Nuevo insight `🔗 Correlación`: detecta el hábito "ancla" que cuando se completa impulsa a completar los demás.
- **HabitCard** — Badge `⚠️` rojo subtil en hábitos at-risk. Se computa en Today screen via `useMemo` comparando `recentCompletions` con los últimos 7 días.

#### 4. Fix Google OAuth
- **login.tsx** — Implementación correcta para React Native: `WebBrowser.maybeCompleteAuthSession()` a nivel módulo, `Linking.createURL('/')` como redirectUrl, `skipBrowserRedirect: true`, `WebBrowser.openAuthSessionAsync(data.url, redirectUrl)`, `supabase.auth.exchangeCodeForSession(result.url)`. Botón con estado `loadingGoogle`.

#### 5. Migración SQL V5
- `supabase/migrations/v5_mood_frequency.sql`:
  - Tabla `mood_entries` (user_id, entry_date, mood 1-5, note) con RLS completo
  - Columnas en `habits`: `frequency_type` ('daily'|'weekly'|'custom'), `frequency_days`, `frequency_weekdays[]`
  - Función `is_habit_due_today()` para Edge Functions futuras

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

#### 8. Rebranding + Settings + Features — V2.3 (2026-04-21)
- **Rebranding Violet Warm** — Paleta de color migrada de Indigo frío a Violet cálido (#7C3AED). Fondos cream (warmGray50) en lugar de blanco puro. Nuevo token `celebration` (pink). Sombras con color cálido en lugar de negro puro.
- **Settings screen** — `src/app/(main)/settings/index.tsx`: perfil (nombre + avatar emoji), apariencia (color de acento), notificaciones, acerca de.
- **Settings store** — `src/stores/settings.store.ts`: `accentColor`, `avatarEmoji`, `notificationTime` persistidos en AsyncStorage.
- **useTheme mejorado** — aplica `accentColor` del settings store en tiempo real (primary, tabActive, heatmap).
- **ACCENT_COLORS + AVATAR_EMOJIS** — nuevas constantes en theme.ts para el picker de Settings.
- **Profile actualizado** — avatar muestra emoji o inicial; botón ⚙️ navega a Settings; `avatar_url` se usa como emoji string.
- **HabitDetailSheet** — `src/components/habits/HabitDetailSheet.tsx`: bottom sheet animado al hacer tap en un hábito. Muestra mini-calendario 30 días, racha, stats, descripción, botón de toggle. Integrado en today/index.tsx.
- **Documento de análisis** — `ANALISIS_V2.2.md`: 1000+ líneas cubriendo look & feel, seguridad, arquitectura, backoffice, UX, roadmap y personalización.

#### 7. Polish & UX — V2.2 (2026-04-21)
- **Score delay eliminado** — `recalculateScore()` se llama INMEDIATAMENTE después del optimistic update (antes de la request de red). Las completions optimistas ya se incluyen en el cálculo. La persist a Supabase es fire-and-forget.
- **Sign out arreglado** — `await supabase.auth.signOut()` + limpieza de habits/completions stores + `setUser(null)` con spinner de carga. Garantiza redirect aunque el signOut falle en red.
- **ScoreRing animación** — Reducida de 1200ms a 350ms para feedback visual snappy.
- **Tab bar** — Emojis reemplazados por `Ionicons` de `@expo/vector-icons`. Íconos filled/outline según foco. Altura 64dp, shadow sutil, labels 10px/600.
- **HabitCard** — Fondo del card ahora se anima suavemente con `interpolateColor` al completar (300ms). Elimina el salto visual brusco.
- **DayProgressBar** — Extraída como componente con Reanimated `useSharedValue` + `useAnimatedStyle`. Se anima suavemente (400ms) al cambiar la tasa de completions.
- **Stats "Por hábito"** — Reordenada por tasa de completions (mejor primero). Muestra racha activa (🔥 N) cuando streak ≥ 2. Porcentaje con color semántico (verde ≥70%, naranja ≥40%, gris <40%). Barra de color lateral en lugar de punto.

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
│   ├── habits/   # HabitCard, HabitForm, HabitTemplatesModal, StreakBadge, ValueInputModal ← NUEVO V3
│   ├── stats/    # HeatmapGrid, ScoreRing, WeeklyChart, InsightsCard ← NUEVO V2
│   ├── gamification/ # XPProgressBar, AchievementCard, StreakFreezeWidget ← NUEVO V2
│   └── ui/       # Button, Card, MotivationCard, MoodPicker, DailyJournalWidget ← NUEVO V4
├── stores/       # user, habits, completions, sync, mood, journal ← NUEVO V4 (Zustand)
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

## CHECKLIST PARA PRIMERA PRUEBA (V5.0)

- [ ] **Migración v5** (si no fue ejecutada) → `supabase/migrations/v5_mood_frequency.sql`
- [ ] **Flujos a testear:**
  1. Crear hábito → sección "🔁 Frecuencia" → elegir "X/semana" con 3 días → verificar badge "3×/sem" en HabitCard + progreso "0/3 esta sem."
  2. Completar ese hábito → verificar que el progreso sube ("1/3 esta sem.", "2/3 esta sem.")
  3. Al llegar a 3/3 → hábito se marca como completado (✓ esta sem.)
  4. Crear hábito con "Días fijos" → elegir L, X, V → verificar que NO aparece en Martes/Jueves/Sábado/Domingo
  5. Perfil → botón 🔗 → modal con carrusel de 5 temas → deslizar/tocar dots → verificar colores distintos
  6. Seleccionar tema "Sunset" → "Compartir imagen" → verificar que captura en naranja/rojo

## CHECKLIST PARA PRIMERA PRUEBA (V4.1)

- [ ] **npm install** — instalar `react-native-view-shot` y `expo-sharing`
- [ ] **Flujos a testear:**
  1. Pantalla Hoy → `JournalCard` visible → tap → `JournalSheet` se abre con prompt del día → escribir → cerrar → verificar auto-save y preview en card
  2. Historial journal: escribir notas en días distintos → reabrir sheet → verificar sección "Días anteriores"
  3. FAB (⚡ por defecto) → `QuickCompleteSheet` → completar hábitos → verificar check animado + auto-cierre con celebración
  4. Settings → "Botón flotante" → cambiar a "Escribir nota" → FAB cambia a 📓 → tap → JournalSheet se abre
  5. Settings → "Botón flotante" → cambiar a "Nuevo hábito" → FAB → navega a tab Hábitos
  6. Perfil → botón 🔗 → `SharePreviewModal` → ver tarjeta dark violet con score, heatmap, stats → "Compartir imagen" (si instalado) o "Compartir texto"

## CHECKLIST PARA PRIMERA PRUEBA (V4.0)

- [ ] **Sin nueva migración SQL** — V4 usa solo el frontend + AsyncStorage
- [ ] **Flujos a testear:**
  1. Tab 📅 → ver Agenda de la semana actual → navegar a semana anterior/siguiente
  2. Pantalla Hoy → escribir nota en el Journal → cerrar app → volver y verificar que persiste
  3. Perfil → botón 🔗 → verificar que abre el share sheet nativo con el resumen
  4. Settings → Notificaciones → "Analizar 🧠" → verificar sugerencia de horario (requiere ≥5 completions)
  5. Hacer tap en un hábito completado → HabitDetailSheet → escribir nota de completion

## CHECKLIST PARA PRIMERA PRUEBA (V3.0)

- [ ] **Migración V5** → `supabase/migrations/v5_mood_frequency.sql` en SQL Editor
- [ ] **Google OAuth** → Configurar URL de redirect `habittracker://` en Supabase Dashboard → Auth → URL Configuration → Redirect URLs
- [ ] **Flujos a testear:**
  1. Crear hábito tipo "Medible" con meta 10 reps → verificar input numérico al completar
  2. Crear hábito tipo "Por tiempo" con meta 30 min → verificar presets y barra de progreso
  3. Registrar mood en pantalla Hoy → verificar que persiste al cerrar/reabrir la app
  4. Dejar un hábito sin completar 7+ días → verificar badge ⚠️ en HabitCard
  5. Con suficientes datos (7+ días): verificar insights de correlación y riesgo en Stats

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

## PRÓXIMOS PASOS (V6+)

1. **Micro-hábitos** (sub-hábitos con lógica de anclaje — requiere schema changes)
2. **Persistir mood + journal en Supabase** (actualmente solo AsyncStorage — tabla mood_entries ya existe)
3. **Mood en Stats** (gráfico de mood vs tasa de completions en pantalla Stats)
4. **IA / sugerencias personalizadas** (OpenAI o Edge Function con contexto del usuario)
5. **Grupos y buddy system** (social básico — requiere schema complejo)
6. **Versión web** (React + Supabase, mismo backend)

---

## VERSIONES

| Versión | Estado | Descripción |
|---------|--------|-------------|
| V1 | ✅ Completo | MVP: registro, dashboard, streaks, heatmap, gamificación, auth, onboarding |
| V2 | ✅ Completo | Gráficos semanales, insights automáticos, plantillas, motivación, streak freeze |
| V3 | ✅ Completo | Hábitos medibles, mood tracking, riesgo abandono, correlaciones, Google OAuth |
| V4 | ✅ Completo | Agenda semanal, journal diario, smart notifications, compartir progreso |
| V4.1 | ✅ Completo | Journal redesign (JournalCard+Sheet), FAB configurable, tarjeta visual redes sociales |
| V5 | ✅ Completo | Frecuencias no-diarias (weekly + custom), carrusel de 5 temas ShareCard |
