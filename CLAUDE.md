# Habit Tracker — Contexto de Proyecto para Claude

> Este archivo se carga automáticamente al inicio de cada sesión. Contiene el estado actual del proyecto, las decisiones técnicas fijadas y las convenciones de desarrollo.

---

## ESTADO ACTUAL: V1 — MVP completo, listo para testear

Leer `CONTEXT_V1.md` para el contexto completo de arquitectura, decisiones y flujos.

---

## STACK

React Native + Expo (~52) · Expo Router · Zustand · Supabase (PostgreSQL + Auth + Edge Functions) · TypeScript · React Native Reanimated 3 · date-fns · AsyncStorage (offline queue)

## ESTRUCTURA CLAVE

```
src/
├── app/          # Expo Router: (auth)/, onboarding/, (main)/
├── components/   # habits/, stats/, gamification/, ui/
├── stores/       # user, habits, completions, sync (Zustand)
├── services/     # supabase, habits, completions, notifications
├── hooks/        # useTheme, useSync
├── utils/        # date, scoring, offline-queue
├── constants/    # theme (dark/light), achievements
└── types/        # index.ts (todos los tipos)

supabase/
├── schema.sql    ← ejecutar primero
├── rls.sql       ← ejecutar segundo
└── functions/    ← calculate-daily-score, sync-offline-queue, send-reminders
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
| Hábitos | Solo frecuencia diaria en V1 |
| Heatmap | Global (todos los hábitos) en V1 |
| Social | No en V1 |
| IA | No en V1 |
| Monetización | Free en V1, preparado para freemium |

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
npm run type-check           # TypeScript check

# Supabase
supabase functions deploy calculate-daily-score
supabase functions deploy sync-offline-queue
supabase functions deploy send-reminders

# EAS Build
eas build --profile development --platform ios
eas build --profile production --platform all
```

---

## PRÓXIMOS PASOS (V2)

1. Testear en dispositivo físico (flujo completo)
2. Gráficos de evolución temporal (gifted-charts ya instalado)
3. Hábitos medibles (tipo ya en DB, falta UI)
4. Frecuencias no diarias (semanal / N veces por semana)
5. Micro-hábitos
6. Plantillas de hábitos pre-cargadas
7. Notificaciones con timing dinámico
8. Streak freeze
9. Correlaciones simples entre hábitos
10. Detección de riesgo de abandono

---

## VERSIONES

| Versión | Estado | Descripción |
|---------|--------|-------------|
| V1 | ✅ Completo | MVP: registro, dashboard, streaks, heatmap, gamificación, auth, onboarding |
| V2 | 🔜 Próximo | Gráficos, hábitos medibles, frecuencias, micro-hábitos, plantillas |
| V3 | 📋 Planificado | Correlaciones, riesgo abandono, mood, journal, social básico |
| V4 | 💡 Futuro | IA, grupos, integraciones, versión web |
