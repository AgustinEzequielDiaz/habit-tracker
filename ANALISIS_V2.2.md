# Habit Tracker — Análisis Integral V2.2

> **Fecha:** 2026-04-21  
> **Estado actual:** V2.2 — MVP completo con gamificación, gráficos, insights, plantillas, scheduling  
> **Audiencia:** Equipo de producto / desarrollo  

---

## Índice

1. [Análisis de Look & Feel + Propuesta de Rebranding](#1-análisis-de-look--feel-actual--propuesta-de-rebranding)
2. [Auditoría de Seguridad](#2-auditoría-de-seguridad)
3. [Análisis de Arquitectura](#3-análisis-de-arquitectura)
4. [Propuesta de Backoffice Web](#4-propuesta-de-backoffice-web)
5. [Oportunidades de UX / Usability](#5-oportunidades-de-ux--usability)
6. [Features Nuevos Priorizados — Roadmap V3–V5](#6-features-nuevos-priorizados--roadmap-v3v5)
7. [Configuración y Personalización del Usuario](#7-configuración-y-personalización-del-usuario)

---

## 1. Análisis de Look & Feel Actual + Propuesta de Rebranding

### 1.1 Qué funciona bien en el diseño actual

- **Modo oscuro bien logrado:** La escala `dark0–dark4` con negros cálidos (no fríos) da una sensación premium y reduce la fatiga visual nocturna.
- **Escala tipográfica coherente:** El rango `xs: 11` a `hero: 40` cubre todos los casos sin improvisaciones.
- **Sombras sutiles:** Los tres niveles de shadow (sm/md/lg) son discretos y profesionales; no sobrecargan la UI.
- **Colores semánticos para el score:** El sistema rojo→amber→verde en el `ScoreRing` es intuitivo y no necesita explicación.
- **`HABIT_COLORS` con 10 opciones:** El abanico incluye violeta, rosa y naranja, que ya apuntan en la dirección correcta.

### 1.2 Qué se siente frío o corporativo

- **Color primario `#6366F1` (Indigo 500):** Es el mismo indigo de Tailwind CSS por defecto. Tiene una connotación de "app de productividad genérica". Es frío, técnico y reconocible como template.
- **Fondo blanco puro en light mode (`#FFFFFF`):** Sin matiz, sin calidez. Los fondos puramente blancos se asocian con apps de gestión empresarial (Jira, Linear), no con apps de bienestar personal.
- **Surface gris frío (`#F9FAFB`):** El gris de Tailwind `gray-50` es neutro pero sin personalidad.
- **Sin color de acento para celebraciones:** No hay un color diferenciado para los momentos de logro (día perfecto, nuevo record). Todo usa el mismo primario.
- **Tab bar con fondo blanco puro:** Se percibe como barra de herramientas de software, no como navegación de app de bienestar.
- **Ausencia de gradientes:** Todos los fondos y cards son planos. Los competidores exitosos en el espacio de hábitos (Habitica, Streaks, Done) usan gradientes sutiles para dar profundidad y calidez.

### 1.3 Paleta propuesta — "Violet Warm"

El objetivo es pasar de *"app de productividad técnica"* a *"compañero de bienestar personal"*. La paleta mantiene sofisticación pero agrega calidez humana.

#### Paleta base

| Token | Color actual | Color propuesto | Hex propuesto | Justificación |
|-------|-------------|----------------|---------------|---------------|
| `primary` | `#6366F1` Indigo | Violet | `#7C3AED` | Más profundo, menos genérico, mismo peso visual |
| `primaryLight` | `#E0E7FF` | Violet suave | `#EDE9FE` | Warm undertone, menos frío |
| `primaryDark` | `#4338CA` | Violet oscuro | `#5B21B6` | Para estados pressed/dark |
| `background` (light) | `#FFFFFF` | Cream warm | `#FEFCFB` | Blanco con matiz cálido imperceptible pero impactante |
| `surface` (light) | `#F9FAFB` | Warm gray | `#F5F4F2` | Gris con undertone warm |
| `card` (light) | `#FFFFFF` | Warm white | `#FFFAF9` | Cards con 1% de calidez |
| `celebration` (nuevo) | — | Soft rose | `#FDF2F8` / `#EC4899` | Para días perfectos, logros |
| `accent` (nuevo) | — | Peach warm | `#FED7AA` / `#FB923C` | Acentos secundarios cálidos |

#### Colores de hábitos — reordenados por calidez

Reemplazar el orden actual para que el violeta sea la opción por defecto (no el indigo genérico):

```typescript
export const HABIT_COLORS = [
  '#7C3AED', // Violet — PRIMARY (default)
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange (warm)
  '#EF4444', // Red
  '#EAB308', // Warm yellow
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue (ultimo, menos warm)
]
```

#### Heatmap con paleta warm

```typescript
heatmap: {
  empty:  '#F0EEF2',  // lavender muy sutil (light) / dark3 (dark)
  low:    '#DDD6FE',  // violet-200
  medium: '#8B5CF6',  // violet-500
  high:   '#6D28D9',  // violet-700
}
```

#### Color de celebración — nuevo token

Agregar a ambos temas:

```typescript
celebration: {
  background: '#FDF2F8',   // pink-50, fondo de modales de logro
  accent:     '#EC4899',   // pink-500, iconos y bordes
  text:       '#9D174D',   // pink-800, texto en celebración
  glow:       'rgba(236,72,153,0.15)', // para shimmer/confetti
}
```

### 1.4 Tipografía

**Situación actual:** Sistema por defecto del OS (San Francisco en iOS, Roboto en Android). Funcional, pero genérico.

**Propuesta:**

- **Mantener fuente del sistema** para el cuerpo de texto (peso, legibilidad, accesibilidad). No vale la pena el tradeoff de bundle size para una fuente custom en body.
- **Agregar una fuente de display para números grandes y títulos:** `Nunito` o `Outfit` de Google Fonts / expo-google-fonts. Ambas tienen formas redondeadas y cálidas — ideales para scores, rachas y niveles.
  - El número de racha "🔥 14" en Nunito Bold se ve mucho más amigable que en SF Pro Display.
  - El `ScoreRing` con el número central en Nunito ExtraBold tiene mayor impacto emocional.

```bash
npx expo install @expo-google-fonts/nunito expo-font
```

```typescript
// Agregar a typography
export const typography = {
  // ...existente...
  displayFont: 'Nunito_800ExtraBold',  // para números hero
  headingFont: 'Nunito_700Bold',       // para títulos de sección
}
```

- **Aumentar line-height en cards:** Cambiar `tight: 1.2` a `tight: 1.3` para que el texto no se sienta apretado en tarjetas de hábitos.

### 1.5 Oportunidades de micro-interacción

| Momento | Interacción actual | Propuesta |
|---------|--------------------|-----------|
| Completar hábito | Animación de color del card (300ms) | Mantener + agregar partículas/confetti (Reanimated) en el primer completion del día |
| Día perfecto | Sin feedback especial | Modal de celebración con fondo `#FDF2F8`, texto animado, confetti de 1s |
| Nuevo nivel | Sin feedback especial | Sheet modal full-screen con nivel nuevo, animación de XP llenando la barra |
| Racha × 7 días | Badge estático | Badge con shimmer animado (Reanimated SharedValue) |
| Score sube | Transición suave del ring | Agregar un "pulse" sutil de escala 1.0 → 1.05 → 1.0 al completar |
| Logro desbloqueado | Toast o notificación | Bottom sheet con card de logro, animación de entrada desde abajo, tap to dismiss |
| Plantilla seleccionada | Navega al form | Animación de "fill" del card de plantilla antes de navegar (150ms) |

### 1.6 Tabla comparativa: estado actual vs. propuesto

| Elemento | Actual | Propuesto |
|----------|--------|-----------|
| Color primario | Indigo `#6366F1` (frío, genérico) | Violet `#7C3AED` (profundo, personal) |
| Fondo light mode | Blanco puro `#FFFFFF` | Cream warm `#FEFCFB` |
| Tipografía de números | SF Pro / Roboto | Nunito ExtraBold |
| Color de celebración | Ninguno | Soft pink `#EC4899` / `#FDF2F8` |
| Gradientes | Ninguno | Gradiente violet en header de pantalla Hoy |
| Heatmap vacío | Gris `#E5E7EB` | Lavender `#F0EEF2` |
| Micro-interacciones | Básicas (color, ring) | Partículas, shimmer, celebrate modal |
| Sensación general | App de productividad B2B | Companion de bienestar personal |

---

## 2. Auditoría de Seguridad

### 2.1 RLS — Row Level Security

**Estado actual:** RLS activado en todas las tablas. Políticas correctamente definidas en `rls.sql`.

**Lo que está bien:**
- Políticas por `auth.uid()` en todas las tablas de usuario.
- `daily_summaries` solo acepta INSERT/UPDATE desde `service_role` — correcto, el cron no debe ser manipulable por el cliente.
- `user_achievements` solo acepta INSERT desde `service_role` — correcto.
- La vista `habits_with_streaks` hereda RLS de las tablas base (Supabase aplica RLS en views correctamente).

**Gaps detectados:**

| Gap | Tabla | Riesgo | Prioridad |
|-----|-------|--------|-----------|
| Policy de `habit_streaks` usa `FOR ALL` — un usuario podría INSERT rachas falsas directamente desde el cliente | `habit_streaks` | Alto: manipulación de rachas | **Alta** |
| Policy de `habit_completions` usa `FOR ALL` — un usuario puede insertar completions con `completed_date` en el futuro o con fechas muy antiguas | `habit_completions` | Alto: manipulación de score | **Alta** |
| No hay CHECK CONSTRAINT en `completed_date` para no aceptar fechas futuras | `habit_completions` | Medio: datos inconsistentes | **Media** |
| `users` acepta UPDATE sin restricciones de campos — el cliente puede actualizar `level`, `total_xp`, `global_score` directamente | `users` | Crítico: escalado artificial de gamificación | **Crítica** |
| No existe RLS en `streak_freezes` (tabla de migración V2) | `streak_freezes` | Alto si la migración fue aplicada | **Alta** |

**Recomendaciones concretas:**

```sql
-- 1. Restringir UPDATE en users para que el cliente NO pueda cambiar level/xp/score
-- Opción A: columna-level security con función
CREATE POLICY "users: update own — restricted" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Solo permite cambiar campos de perfil, nunca los de gamificación
    auth.uid() = id
    -- level, total_xp, global_score solo modificables por service_role
  );

-- La forma más limpia: crear una función SECURITY DEFINER para actualizar el perfil
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE public.users SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url   = COALESCE(p_avatar_url, avatar_url),
    username     = COALESCE(p_username, username)
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Y revocar el UPDATE directo sobre users para el rol anon/authenticated
-- (solo permitir via la función)
```

```sql
-- 2. Restricción en habit_completions para no permitir fechas futuras
ALTER TABLE public.habit_completions
  ADD CONSTRAINT no_future_completions
  CHECK (completed_date <= CURRENT_DATE);

-- 3. Restricción para no permitir fechas con más de 1 año de antigüedad (anti-spam)
ALTER TABLE public.habit_completions
  ADD CONSTRAINT no_ancient_completions
  CHECK (completed_date >= CURRENT_DATE - INTERVAL '365 days');
```

```sql
-- 4. RLS para streak_freezes (si se aplicó la migración V2)
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "freezes: select own" ON public.streak_freezes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "freezes: insert own" ON public.streak_freezes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE ni DELETE — los freezes son inmutables una vez usados
```

```sql
-- 5. habit_streaks: separar INSERT/UPDATE del SELECT para que el cliente no inserte rachas
DROP POLICY "streaks: all own" ON public.habit_streaks;
CREATE POLICY "streaks: select own" ON public.habit_streaks
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE solo desde service_role (cron y sync function)
CREATE POLICY "streaks: service write" ON public.habit_streaks
  FOR ALL USING (auth.role() = 'service_role');
```

### 2.2 ANON Key en cliente — Exposición aceptable con límites

**Situación actual:** `EXPO_PUBLIC_SUPABASE_ANON_KEY` expuesta en el bundle del cliente (comportamiento esperado con Expo).

**Análisis:**
- La ANON key por sí sola solo puede hacer lo que RLS permite — su exposición no es un riesgo si RLS está bien configurado.
- El riesgo es si hay tablas sin RLS, políticas demasiado permisivas o funciones RPC sin autenticación.
- El bundle de Expo compilado en producción puede ser descompilado — la key **siempre** va a ser visible.

**Recomendaciones:**

| Recomendación | Prioridad |
|---------------|-----------|
| Nunca usar `service_role` key en el cliente mobile (ya está bien — el proyecto no lo hace) | Informativo |
| Verificar en Supabase Dashboard → API que no hay tablas con RLS desactivado | **Alta** |
| Agregar `Allowed Origins` en Supabase Auth para restringir a los bundle IDs de la app | **Media** |
| Rotar la ANON key si se sospecha que fue comprometida (ej: commit accidental a git) | Contingencia |
| Agregar `.env` a `.gitignore` y verificar que no hay commits previos con keys | **Alta** |

### 2.3 Manejo de tokens de Auth

**Estado actual:** Tokens guardados en `AsyncStorage` (configurado en `supabase.ts` con `storage: AsyncStorage`).

**Análisis de riesgo:**

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| `AsyncStorage` en Android no está cifrado en dispositivos sin SELinux | Bajo-Medio | Aceptable para V2, documentar |
| `AsyncStorage` en iOS sí está protegido por el Keychain (Expo lo maneja) | Bajo | OK |
| Token refresh automático activado (`autoRefreshToken: true`) | Positivo | OK |
| `detectSessionInUrl: false` — correcto para apps mobile | Positivo | OK |

**Recomendación para V3:** Migrar a `expo-secure-store` para el token de Supabase en Android. Supabase lo soporta natively pasando un adaptador:

```typescript
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,  // reemplazar AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### 2.4 Rate Limiting y Validación de Input

**Gaps detectados:**

| Gap | Descripción | Prioridad |
|-----|-------------|-----------|
| Sin rate limiting en completions | Un cliente puede hacer spam de `upsert` a `habit_completions` via herramientas externas con el token robado | **Media** |
| Sin validación server-side del campo `note` | Campo libre, podría contener HTML/scripts si hay una UI web futura | **Baja** |
| Sin límite de hábitos por usuario | Un usuario podría crear 10.000 hábitos — DoS suave sobre la DB | **Media** |
| Sin validación de longitud en `display_name` / `username` en el cliente | Aunque la DB tiene constraints, el cliente no da feedback antes de la request | **Baja** |
| `notifications.service.ts` — `push_token` guardado sin validación de formato | Un token malformado podría causar errores en el cron de notificaciones | **Baja** |

**Recomendaciones concretas:**

```sql
-- Límite de hábitos por usuario (trigger)
CREATE OR REPLACE FUNCTION check_habit_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM habits WHERE user_id = NEW.user_id AND is_archived = false) >= 50 THEN
    RAISE EXCEPTION 'Límite de 50 hábitos activos por usuario';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW EXECUTE FUNCTION check_habit_limit();
```

```typescript
// Validación en HabitForm antes de submit
const MAX_HABIT_NAME_LENGTH = 80
const MAX_DESCRIPTION_LENGTH = 300

if (form.name.trim().length === 0) throw new Error('El nombre es obligatorio')
if (form.name.length > MAX_HABIT_NAME_LENGTH) throw new Error(`Máximo ${MAX_HABIT_NAME_LENGTH} caracteres`)
```

### 2.5 Resumen de prioridades de seguridad

| # | Problema | Prioridad | Esfuerzo |
|---|----------|-----------|---------|
| 1 | `users` tabla: cliente puede escribir `level`/`total_xp`/`global_score` | **Crítica** | 2h |
| 2 | `habit_streaks`: cliente puede insertar rachas falsas | **Alta** | 1h |
| 3 | Fecha futura en `habit_completions` | **Alta** | 30min |
| 4 | RLS faltante en `streak_freezes` | **Alta** | 30min |
| 5 | Límite de hábitos por usuario | **Media** | 1h |
| 6 | `.env` en `.gitignore` verificado | **Alta** | 10min |
| 7 | Migración a `expo-secure-store` | **Media** | 3h |
| 8 | Rate limiting en completions | **Media** | 2h (via Supabase Edge o pg_cron) |
| 9 | Validación de input en formularios | **Baja** | 2h |

---

## 3. Análisis de Arquitectura

### 3.1 Lo que está sólido

**Offline queue con AsyncStorage:**
- El patrón de cola + sync via Edge Function es robusto y simple. No hay riesgo de conflictos gracias al UPSERT con `onConflict: 'habit_id,user_id,completed_date'`.
- El modelo de `OfflineOperation` tipado con `operation: 'complete_habit' | 'uncomplete_habit'` es extensible sin romper compatibilidad.
- La separación entre operaciones optimistas (UI) y persistencia (red) está bien implementada.

**Optimistic updates correctamente:**
- El score se recalcula client-side inmediatamente (sin esperar respuesta de red).
- `recalculateScore()` antes de la request de red es la decisión correcta — el usuario ve feedback instantáneo.

**Zustand V5 bien utilizado:**
- Stores separados por dominio (user, habits, completions, sync) — sin god object.
- No se importan stores directamente en componentes — se usan hooks, lo que facilita testing.

**Supabase RLS como primera línea de defensa:**
- La arquitectura confía en RLS (correcto) y no intenta reimplementar ACL en el cliente (anti-patrón evitado).

**Edge Functions para jobs costosos:**
- `calculate-daily-score`, `sync-offline-queue`, `send-reminders` fuera del cliente — correcto para operaciones batch.

**TypeScript estricto:**
- `npm run type-check` pasa con 0 errores — esto es valiosa deuda técnica cero.

### 3.2 Riesgos identificados

#### Riesgo 1 — Score calculado 100% en el cliente (CRÍTICO)

**Problema:** `recalculateScore()` en el habits store calcula el `global_score`, `level` y `total_xp` basándose en completions del store local. Luego persiste ese valor calculado en la tabla `users` via UPDATE directo.

```
Cliente calcula score → UPDATE users SET global_score = X → Supabase acepta sin validar
```

Un usuario con conocimiento técnico puede:
1. Interceptar la request con Proxyman/Charles
2. Modificar el body del PATCH a `users` con `global_score: 100, level: 99, total_xp: 999999`
3. Supabase acepta porque la policy de `users` solo verifica `auth.uid() = id` (sin validar los valores)

**Solución recomendada:** Mover el cálculo de score al servidor.

```typescript
// supabase/functions/recalculate-score/index.ts
// Llamar después de cada completion, en lugar de UPDATE directo a users

Deno.serve(async (req) => {
  const { user_id } = await req.json()
  // Calcular score con datos reales de la DB
  // UPDATE users SET global_score, level, total_xp WHERE id = user_id
  // Retornar nuevos valores al cliente
})
```

El cliente usa el resultado de la Edge Function para actualizar el store local — sin permitir que el cliente envíe el score calculado.

#### Riesgo 2 — Sin paginación en habit_completions

**Problema:** `completionsService.getForRange()` no tiene límite. Si un usuario tiene 50 hábitos activos durante 2 años → ~36.000 filas potenciales en una sola query.

**Impacto:** Consultas lentas en la pantalla de Stats, timeout en Supabase Free Tier (10s), degradación general.

**Solución:**

```typescript
// Siempre paginar
async getForRange(fromDate: string, toDate: string, page = 0, pageSize = 500): Promise<HabitCompletion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .gte('completed_date', fromDate)
    .lte('completed_date', toDate)
    .order('completed_date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  // ...
}
```

Para el heatmap (hasta 365 días), hacer la query solo sobre `daily_summaries` (ya pre-calculadas) en lugar de `habit_completions`.

#### Riesgo 3 — Supabase Free Tier

**Límites actuales del Free Tier que pueden afectar:**

| Límite | Free Tier | Impacto proyectado |
|--------|-----------|-------------------|
| Filas totales en DB | 500 MB | ~50K usuarios × 50 hábitos = manejable hasta 1K usuarios |
| Conexiones simultáneas | 60 | Cuello de botella con >200 usuarios activos simultáneos |
| Edge Function invocaciones | 500K/mes | El cron diario a 1K usuarios = 30K/mes — OK |
| Bandwidth | 5 GB/mes | Puede alcanzarse con users activos + media |
| Pause de proyecto | 7 días sin actividad | Riesgo si el proyecto no tiene uso continuo |

**Recomendación:** Migrar a Pro Tier ($25/mes) al superar 500 usuarios activos. Configurar alerta en Supabase Dashboard.

#### Riesgo 4 — Sin cache local de summaries históricos

**Problema:** Cada vez que el usuario abre la pantalla de Stats, se re-fetcha `daily_summaries` de los últimos 90 días.

**Solución:** Cache con `AsyncStorage` + timestamp de expiración:

```typescript
// utils/cache.ts
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

async function getCachedSummaries(userId: string): Promise<DailySummary[] | null> {
  const raw = await AsyncStorage.getItem(`summaries_cache_${userId}`)
  if (!raw) return null
  const { data, cachedAt } = JSON.parse(raw)
  if (Date.now() - cachedAt > CACHE_TTL_MS) return null
  return data
}
```

#### Riesgo 5 — Edge Function coverage incompleta

**Funciones existentes:**
- `calculate-daily-score` — OK
- `sync-offline-queue` — OK
- `send-reminders` — OK

**Funciones faltantes:**

| Función | Necesidad | Prioridad |
|---------|-----------|-----------|
| `recalculate-user-score` | Mover score calculation del cliente al servidor | **Alta** |
| `cleanup-old-completions` | Archivar completions > 2 años para controlar tamaño de DB | **Baja** |
| `validate-streak` | Recalcular rachas en servidor antes de actualizar `habit_streaks` | **Media** |
| `handle-achievement-unlock` | Verificar y desbloquear logros desde el servidor (no confiar en el cliente) | **Media** |

### 3.3 Recomendaciones arquitectónicas

| Recomendación | Prioridad | Esfuerzo |
|---------------|-----------|---------|
| Mover cálculo de score a Edge Function | **Alta** | 1 día |
| Agregar paginación en todas las queries de completions | **Alta** | 4h |
| Cache local de daily_summaries | **Media** | 3h |
| Index en `habit_completions(user_id, completed_date)` si no existe | **Alta** | 15min |
| Index en `habit_completions(habit_id, completed_date)` | **Alta** | 15min |
| Monitoring de performance en Supabase Dashboard | **Media** | 30min |

```sql
-- Índices recomendados (verificar si ya existen)
CREATE INDEX IF NOT EXISTS idx_completions_user_date
  ON habit_completions(user_id, completed_date DESC);

CREATE INDEX IF NOT EXISTS idx_completions_habit_date
  ON habit_completions(habit_id, completed_date DESC);

CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON habits(user_id) WHERE is_archived = false AND is_active = true;
```

---

## 4. Propuesta de Backoffice Web

### 4.1 Stack recomendado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 14 (App Router) | SSR nativo, API Routes para service_role, TypeScript first |
| UI Components | shadcn/ui + Tailwind CSS | Componentes de alta calidad, customizables, zero runtime |
| Gráficos | Recharts | Ligero, composable, TypeScript nativo |
| Auth admin | Supabase Auth + middleware | Misma instancia, admin por email whitelist |
| DB client | Supabase JS (service_role en API Routes) | Nunca en el cliente Next.js |
| Deploy | Vercel | Zero-config con Next.js, preview deployments |
| Estado | TanStack Query v5 | Cache, invalidación, loading states |

**Estructura del proyecto:**

```
habit-tracker-admin/
├── app/
│   ├── (auth)/login/         # Login con email/password para admins
│   ├── dashboard/            # Analytics principal
│   ├── users/                # Gestión de usuarios
│   │   ├── page.tsx          # Lista con search
│   │   └── [id]/page.tsx     # Detalle de usuario
│   ├── habits/               # Gestión de plantillas
│   └── settings/             # Config del backoffice
├── components/
│   ├── charts/               # Wrappers de Recharts
│   ├── tables/               # DataTable con shadcn
│   └── ui/                   # shadcn components
├── lib/
│   ├── supabase-admin.ts     # Cliente con service_role (server-only)
│   └── analytics.ts          # Queries de analytics
└── app/api/
    ├── users/                # API Routes con service_role
    └── analytics/            # API Routes para datos agregados
```

**Regla de oro — service_role solo en el servidor:**

```typescript
// lib/supabase-admin.ts — SOLO importar desde API Routes o Server Components
import { createClient } from '@supabase/supabase-js'

// Este archivo NUNCA debe ser importado desde componentes cliente ('use client')
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NUNCA EXPO_PUBLIC_
  { auth: { persistSession: false } }
)
```

### 4.2 MVP — Analytics Dashboard

**Pantalla principal con métricas clave:**

#### Métricas de actividad

| Métrica | Query | Gráfico |
|---------|-------|---------|
| DAU (Daily Active Users) | `COUNT DISTINCT user_id FROM habit_completions WHERE completed_date = TODAY` | LineChart 30 días |
| MAU (Monthly Active Users) | `COUNT DISTINCT user_id FROM habit_completions WHERE completed_date >= 30 days ago` | Número con tendencia |
| Tasa de retención D7 | Usuarios que completaron hábitos 7 días después del registro | Retention curve |
| Tasa de retención D30 | Idem a 30 días | Retention curve |

#### Métricas de contenido

| Métrica | Query | Gráfico |
|---------|-------|---------|
| Hábitos más creados | `COUNT(*) FROM habits GROUP BY name ORDER BY count DESC LIMIT 10` | BarChart horizontal |
| Categoría más popular | `COUNT(*) FROM habits GROUP BY category` | PieChart |
| Tasa promedio de completion | `AVG(completion_rate) FROM daily_summaries WHERE summary_date = TODAY` | Gauge |
| Usuarios con racha activa ≥7 días | `COUNT FROM habit_streaks WHERE end_date IS NULL AND length_days >= 7` | Número |

#### Curvas de retención y abandono

```sql
-- Retención cohort (usuarios por semana de registro)
SELECT
  DATE_TRUNC('week', u.created_at) AS cohort_week,
  COUNT(DISTINCT u.id) AS cohort_size,
  COUNT(DISTINCT CASE WHEN ds.summary_date >= u.created_at + INTERVAL '7 days' THEN ds.user_id END) AS retained_d7,
  COUNT(DISTINCT CASE WHEN ds.summary_date >= u.created_at + INTERVAL '30 days' THEN ds.user_id END) AS retained_d30
FROM users u
LEFT JOIN daily_summaries ds ON ds.user_id = u.id AND ds.habits_completed > 0
GROUP BY cohort_week
ORDER BY cohort_week DESC;
```

#### Detección de abandono

```sql
-- Usuarios que estuvieron activos y llevan 7+ días sin completar nada
SELECT u.id, u.display_name, u.created_at,
       MAX(ds.summary_date) AS last_active_date,
       CURRENT_DATE - MAX(ds.summary_date) AS days_inactive
FROM users u
JOIN daily_summaries ds ON ds.user_id = u.id AND ds.habits_completed > 0
GROUP BY u.id, u.display_name, u.created_at
HAVING CURRENT_DATE - MAX(ds.summary_date) BETWEEN 7 AND 30
ORDER BY days_inactive DESC;
```

### 4.3 MVP — Gestión de Usuarios

**Funcionalidades del MVP:**

| Feature | Descripción | Implementación |
|---------|-------------|----------------|
| Búsqueda de usuarios | Por email, display_name, username | Full-text search en API Route con service_role |
| Ver perfil completo | Level, XP, score, racha actual, fecha de registro, último activo | Query a `users` + `daily_summaries` |
| Ver lista de hábitos | Todos los hábitos del usuario (activos + archivados) | Query a `habits` WHERE user_id |
| Ver actividad reciente | Últimas 30 completions | Query a `habit_completions` |
| Editar display_name | Para soporte al usuario | PATCH via API Route |
| Suspender cuenta | Marcar usuario como inactivo (soft delete) | Nuevo campo `is_suspended` en `users` |
| Ver logros desbloqueados | Lista de achievements | Query a `user_achievements` |
| Impersonar usuario (support) | Generar link de acceso temporal para soporte | `supabase.auth.admin.generateLink()` |

**Pantalla de usuario — wireframe de secciones:**

```
┌─────────────────────────────────────────────────────┐
│ [←] Agustín Díaz             [Editar] [Suspender]   │
├────────────────┬────────────────────────────────────┤
│ PERFIL         │ ACTIVIDAD (últimos 30 días)         │
│ Level: 12      │ ████░░░░░░ 45% completion rate      │
│ XP: 2,450      │ [mini heatmap 30 días]              │
│ Score: 78/100  │                                     │
│ Registrado:    │ Último activo: hace 2 días          │
│ 2026-01-15     │                                     │
├────────────────┴────────────────────────────────────┤
│ HÁBITOS (8 activos)                                 │
│ 🏃 Correr 30min  [Fitness]  🔥12d  89% / 30d        │
│ 📚 Leer         [Produc.]  🔥 3d  62% / 30d         │
│ ...                                                  │
├─────────────────────────────────────────────────────┤
│ LOGROS (5 desbloqueados)                            │
│ 🏆 Primera semana · 🔥 Racha 30d · ⭐ 100 completes │
└─────────────────────────────────────────────────────┘
```

### 4.4 Features futuros del Backoffice

| Feature | Descripción | Versión |
|---------|-------------|---------|
| Gestión de plantillas | CRUD de habit-templates desde el backoffice (sin deploy) | V2 Backoffice |
| Campañas de push notification | Segmentar usuarios y enviar notificaciones masivas | V2 Backoffice |
| A/B testing hooks | Flag features para % de usuarios, medir impacto en completions | V3 Backoffice |
| Export de datos | CSV / JSON de métricas para análisis externo | V2 Backoffice |
| Moderación de usernames | Filtro automático + revisión manual de usernames ofensivos | V2 Backoffice |
| Dashboard de Edge Functions | Logs y errores de los cron jobs en tiempo real | V1.5 Backoffice |

### 4.5 Esfuerzo estimado

| Fase | Contenido | Estimación |
|------|-----------|------------|
| Setup inicial | Next.js + shadcn + auth admin + deploy Vercel | 2 días |
| Analytics Dashboard MVP | 8 métricas + 3 gráficos + retention table | 5 días |
| User Management MVP | Lista + detalle + edit + suspend | 5 días |
| Polish y testing | Responsive, dark mode, error handling | 2 días |
| **Total MVP** | | **~3–4 semanas** |

---

## 5. Oportunidades de UX / Usability

### 5.1 Quick-add desde la pantalla Hoy

**Problema actual:** Crear un nuevo hábito requiere ir a la tab "Hábitos" → botón "+" → rellenar todo el formulario → volver a "Hoy". Son 5+ pasos para algo que el usuario quiere hacer en el momento.

**Propuesta:** Botón flotante (+) en la pantalla Hoy que abre directamente las plantillas en un bottom sheet. El usuario elige una plantilla en 1 tap y el hábito queda activo para el día actual. Para hábitos customizados, toca el ícono de "personalizar" desde el sheet.

```typescript
// Flujo propuesto (2 taps desde Hoy):
// [+FAB] → BottomSheet con categorías → Tap plantilla → Habit creado ✓
```

**Impacto esperado:** Reducción de fricción en creación → +15–25% de hábitos creados por usuario activo.

### 5.2 Nota opcional al completar un hábito

**Problema actual:** Al marcar un hábito como completado, el registro es solo un boolean (o un valor numérico para hábitos medibles). El usuario no puede registrar contexto.

**Propuesta:** Long-press en el HabitCard (o swipe action) abre un micro-modal con un campo de nota de texto libre (max 200 chars). Para el caso normal (sin nota), el tap sigue siendo el mismo.

**Valor:**
- Para el usuario: journaling liviano integrado al hábito.
- Para el producto: datos cualitativos para futuras features de insights.
- Schema: el campo `note` ya existe en `HabitCompletion` — solo falta la UI.

**Prioridad:** Alta. Esfuerzo: 4h. El modelo ya lo soporta.

### 5.3 Pantalla de detalle de hábito

**Problema actual:** Tocar un hábito en la lista no hace nada (o abre el form de edición). El usuario no puede ver el historial de un hábito específico.

**Propuesta:** Tap en HabitCard → `app/(main)/habits/[id].tsx` con:

```
┌─────────────────────────────────────┐
│ [←] 🏃 Correr 30 minutos     [···]  │
├─────────────────────────────────────┤
│  🔥 12 días   89%   📅 32 días      │
│  racha actual  rate  días activo    │
├─────────────────────────────────────┤
│ Mini-calendario (últimos 3 meses)   │
│ ● ● ● ○ ● ● ●  ← heatmap del hábito│
├─────────────────────────────────────┤
│ Últimas notas                       │
│ "Mañana fría pero lo hice igual"    │
│ "Lluvia — trotadora en casa"        │
├─────────────────────────────────────┤
│ [Editar hábito]   [Archivar]        │
└─────────────────────────────────────┘
```

**Impacto:** Aumenta el tiempo en app, da sensación de "historia personal" que refuerza la identidad del usuario con su hábito.

### 5.4 Onboarding mejorado

**Problemas actuales:**
- El onboarding termina en la pantalla Hoy vacía — sin hábitos, sin contexto de qué hacer.
- El usuario no ve el potencial de la app hasta que tiene datos (ciclo negativo).

**Propuesta de flujo:**

```
Registro → Confirmar email
         → Pantalla "Bienvenido a [nombre]"
         → "¿Cuál es tu primer objetivo?" (selector de 4 categorías)
         → Muestra 3 plantillas sugeridas de esa categoría
         → El usuario activa 1–3 hábitos con un tap
         → Pantalla Hoy ya tiene hábitos para completar
         → Primera completion → célula de onboarding: "Completaste tu primer hábito 🎉"
```

**Cambio de implementación:** Agregar paso de "plantillas sugeridas" entre `onboarding/goals` y el redirect a `(main)/today`. No requiere cambios de schema.

### 5.5 Empty states con CTA claros

**Situación actual:** La pantalla Hoy sin hábitos muestra un mensaje genérico.

**Propuesta:** Empty states específicos por contexto:

| Pantalla | Empty state actual | Empty state propuesto |
|----------|-------------------|-----------------------|
| Hoy — sin hábitos | Texto genérico | Ilustración + "Tu día empieza aquí" + [Elegir de plantillas] |
| Stats — sin datos | Probablemente básico | "Completa 3 días para ver tus primeros insights" + progress indicator |
| Hábitos — lista vacía | CTA de plantillas (ya existe en V2) | Mantener + agregar social proof: "Usuarios como vos completan 4.2 hábitos/día" |

### 5.6 Celebración de día perfecto

**Propuesta:** Cuando `completionRate === 1.0` al completar el último hábito del día:

1. Animación de confetti (usar `react-native-confetti-cannon` o implementar con Reanimated + partículas).
2. Modal/sheet por 2.5 segundos: "¡Día perfecto! 🌟 +50 XP bonus".
3. Tab bar con un subtil glow/ring dorado por el resto del día.

**Trigger:** En `completions.store.ts`, detectar cuando `completedCount === totalCount` después de un toggle y llamar a `triggerPerfectDayAnimation()`.

### 5.7 Notificaciones inteligentes

**Propuesta de sistema de timing dinámico (V3):**

- Analizar a qué hora el usuario suele completar cada hábito (median de `completed_at` por hábito).
- Enviar reminder 30 minutos antes de la hora habitual si el hábito no está completado.
- Mensaje personalizado: `"Casi las 8pm — hoy no corriste todavía 🏃"` vs. `"Recordatorio: Correr 30 minutos"`.

**Schema change necesario:**

```sql
-- En notification_prefs, agregar:
ALTER TABLE notification_prefs
  ADD COLUMN habit_timing JSONB DEFAULT '{}'::jsonb;
-- Estructura: { "habit_uuid": "19:45", "otro_habit": "08:00" }
```

### 5.8 Rachas más prominentes

**Propuesta:**
- Mostrar la racha más alta activa en el header de la pantalla Hoy (actualmente solo hay ScoreRing).
- En HabitCard, agrandar el badge de racha de `🔥 12` a un chip más visible cuando streak ≥ 7.
- En la pantalla de Stats, agregar una sección "Tus records" con la racha más larga de cada hábito.

### 5.9 Resumen semanal push notification

**Propuesta:** Notificación los domingos a las 19:00 hora local:

```
"Tu semana en Habit Tracker
Completaste 67% de tus hábitos ↑ vs semana anterior
Mejor día: Miércoles (100% 🌟)
Racha activa más larga: Correr · 12 días 🔥
Esta semana, ¡a por el 75%!"
```

**Implementación:** Nuevo cron job `send-weekly-summary` vía GitHub Actions (domingos 22:00 UTC) llamando a una Edge Function que genera y envía las notificaciones por usuario.

---

## 6. Features Nuevos Priorizados — Roadmap V3–V5

**Criterios de priorización:**
- **Impacto:** efecto en retención, engagement y percepción de valor (1–5)
- **Esfuerzo:** días de desarrollo estimados (S=1–2d, M=3–5d, L=7–14d, XL=15+d)

| # | Feature | Impacto | Esfuerzo | Versión | Descripción |
|---|---------|---------|---------|---------|-------------|
| 1 | **Pantalla de detalle de hábito** | 5 | S (2d) | V3 | Tap en hábito → historial, mini-heatmap, notas recientes, stats individuales |
| 2 | **Nota al completar hábito** | 4 | S (1d) | V3 | Long-press o swipe → micro-modal con campo de texto libre (200 chars). Schema ya listo |
| 3 | **Hábitos medibles con UI de input** | 5 | M (4d) | V3 | Completar con valor numérico. Input spinner al tocar hábito tipo "measurable". Gráfico de tendencia en detalle |
| 4 | **Settings / Configuración** | 3 | M (3d) | V3 | Pantalla de ajustes completa: perfil, notificaciones, apariencia, privacidad, cerrar sesión |
| 5 | **Avatar emoji picker** | 3 | S (1d) | V3 | Selector de 16–24 emojis como avatar de perfil. Alta retención por personalización |
| 6 | **Selector de color de acento** | 3 | S (2d) | V3 | 8 opciones de color primario. Almacenado en AsyncStorage + users table |
| 7 | **Quick-add desde pantalla Hoy** | 4 | S (2d) | V3 | FAB (+) → bottom sheet de plantillas → hábito activo en 2 taps |
| 8 | **Celebración de día perfecto** | 4 | S (2d) | V3 | Confetti + modal al completar 100%. Muy alto impacto en satisfacción emocional |
| 9 | **Frecuencias no diarias** | 5 | L (10d) | V3 | Hábitos N veces por semana (ej: "3 veces"). Requiere cambios en schema, scoring y UI |
| 10 | **Alerta de riesgo de abandono** | 4 | M (4d) | V3 | Detectar caída de frecuencia en los últimos 7 días → notificación re-engagement personalizada |
| 11 | **Mood tracking diario** | 4 | M (5d) | V4 | Registro de estado de ánimo (1–5 o emojis). Correlación simple con completion rate |
| 12 | **Correlaciones entre hábitos** | 4 | M (5d) | V4 | "Los días que corrés, también meditás el 85% de las veces". Stats > sección correlaciones |
| 13 | **Micro-hábitos (sub-pasos)** | 3 | L (8d) | V4 | Un hábito puede tener 2–5 sub-pasos. Completar todos = completion. Lógica de anclaje de hábitos |
| 14 | **Journal integrado** | 3 | L (8d) | V4 | Entrada de diario por día. Formato simple: texto libre. Vinculado a daily_summary |
| 15 | **Widget de pantalla de inicio** | 5 | L (10d) | V4 | iOS: WidgetKit via React Native. Android: Glance. Mostrar progreso del día y botón de completion |
| 16 | **Buddy / compañero de hábitos** | 4 | XL (15d) | V5 | Compartir racha con un amigo. Notificación cuando el otro completa. Sin social feed |
| 17 | **Apple Health / Google Fit** | 3 | L (12d) | V5 | Importar pasos, sueño, peso como completions automáticas. Reducción de fricción máxima |
| 18 | **Notificaciones con timing dinámico** | 4 | M (5d) | V3 | Analizar horario habitual por hábito y ajustar reminder automáticamente |
| 19 | **Onboarding con plantillas** | 4 | S (2d) | V3 | Mejorar onboarding: elegir objetivo → plantillas sugeridas → primeros hábitos en 60 seg |
| 20 | **Resumen semanal push** | 3 | S (2d) | V3 | Notificación dominical con highlights de la semana y motivación para la siguiente |

### Roadmap resumido por versión

**V3 (próximos 6–8 semanas):**
Detalle de hábito · Nota al completar · Hábitos medibles UI · Settings · Avatar emoji · Quick-add · Celebración · Alerta abandono · Onboarding mejorado · Timing dinámico notificaciones

**V4 (semanas 9–20):**
Mood tracking · Correlaciones · Micro-hábitos · Journal · Widget OS · Frecuencias no diarias

**V5 (mes 6+):**
Buddy system · Apple Health / Google Fit · Features sociales básicos

---

## 7. Configuración y Personalización del Usuario

### 7.1 Pantalla de Settings — Diseño de secciones

La pantalla de configuración no existe aún. Esta es la propuesta para `app/(main)/profile/settings.tsx` (o accesible desde el perfil vía botón de engranaje):

```
Settings
│
├── PERFIL
│   ├── Nombre para mostrar (editable inline)
│   ├── Username @usuario (editable con validación de disponibilidad)
│   └── Email (solo lectura, con opción "Cambiar contraseña")
│
├── APARIENCIA
│   ├── Avatar (emoji picker — 24 opciones)
│   ├── Color de acento (8 chips de color)
│   └── Tema (Claro / Oscuro / Sistema)
│
├── NOTIFICACIONES
│   ├── Toggle global de notificaciones
│   ├── Hora de recordatorio diario (TimePicker)
│   ├── Resumen semanal (toggle — domingo 19:00)
│   └── Alertas de racha en riesgo (toggle)
│
├── PRIVACIDAD
│   ├── Borrar todos los datos (destructivo — confirm modal)
│   └── Exportar mis datos (genera JSON descargable)
│
├── ACERCA DE
│   ├── Versión de la app
│   ├── Términos de uso
│   └── Política de privacidad
│
└── CUENTA
    └── Cerrar sesión (con confirmación)
```

### 7.2 Avatar emoji picker

**Propuesta de 24 opciones** organizadas en 4 filas de 6:

```typescript
export const AVATAR_EMOJIS = [
  // Personas y expresiones
  '😊', '😎', '🤩', '🥳', '🧘', '🏃',
  // Animales (populares en apps de bienestar)
  '🦁', '🐺', '🦊', '🐻', '🐼', '🦅',
  // Naturaleza y energía
  '⚡', '🔥', '🌊', '🌱', '⭐', '🌙',
  // Fitness y actividades
  '💪', '🎯', '🏆', '📚', '🎨', '🚀',
]
```

**Implementación:**

```typescript
// components/ui/AvatarEmojiPicker.tsx
// Grid 6x4 con tap → selección animada (scale 1.2 + checkmark)
// Persiste en users.avatar_url como string de emoji (si avatar_url !== URL http)
// Si es un emoji, mostrar en un View con fondo de color del tema

// Lógica en ProfileScreen:
const isEmojiAvatar = avatar_url && !avatar_url.startsWith('http')
```

**Schema — no requiere cambios.** `avatar_url TEXT` puede almacenar un emoji (string de 2–4 bytes UTF-8) o una URL de imagen. La UI detecta si es URL o emoji y renderiza acordemente.

### 7.3 Selector de color de acento

**8 opciones predefinidas** (incluye el violet propuesto como default):

```typescript
export const ACCENT_COLORS = [
  { key: 'violet',  hex: '#7C3AED', label: 'Violeta' },    // default propuesto
  { key: 'indigo',  hex: '#6366F1', label: 'Índigo' },     // default actual
  { key: 'blue',    hex: '#3B82F6', label: 'Azul' },
  { key: 'teal',    hex: '#0D9488', label: 'Teal' },
  { key: 'green',   hex: '#16A34A', label: 'Verde' },
  { key: 'orange',  hex: '#EA580C', label: 'Naranja' },
  { key: 'rose',    hex: '#E11D48', label: 'Rosa' },
  { key: 'amber',   hex: '#D97706', label: 'Ámbar' },
]
```

**Implementación:**

```typescript
// stores/preferences.store.ts (nuevo store)
interface PreferencesState {
  accentColor: string        // hex
  avatarEmoji: string | null
  theme: 'light' | 'dark' | 'system'
  setAccentColor: (color: string) => void
  setAvatarEmoji: (emoji: string) => void
  setTheme: (theme: string) => void
  _persist: () => void  // guarda en AsyncStorage
}

// El store inyecta el accentColor en el tema dinámicamente:
const theme = useTheme()
const { accentColor } = usePreferencesStore()
const dynamicPrimary = accentColor || theme.colors.primary
```

**Persistencia:**
- Guardar en `AsyncStorage` (respuesta inmediata, sin round-trip a Supabase).
- Sincronizar con `users` table en background (para mantener el color si el usuario reinstala).
- Agregar columna `accent_color TEXT DEFAULT '#7C3AED'` a la tabla `users`.

```sql
-- Migración v4_user_preferences.sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#7C3AED',
  ADD COLUMN IF NOT EXISTS avatar_emoji TEXT,
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system'
    CHECK (theme_preference IN ('light', 'dark', 'system'));
```

### 7.4 Por qué la personalización impulsa la retención

La personalización crea **ownership psicológico** — cuando el usuario siente que la app "es suya", el costo percibido de abandonarla aumenta significativamente.

**Evidencia del mercado:**
- Habitica (la app de hábitos gamificada) tiene una retención D30 ~3x más alta que la media del segmento. Su diferencial principal: avatares y personalización profunda.
- Duolingo experimentó un aumento del 12% en D7 retention al agregar la posibilidad de personalizar el avatar del "streak mascot".
- La tesis de producto: **personalización superficial (emoji/color) tiene ROI desproporcionado** porque el costo de implementación es bajo (S effort) pero el impacto en ownership/retención es alto.

**Secuencia de implementación recomendada:**

1. **Avatar emoji** primero (1 día, alto impacto inmediato).
2. **Color de acento** segundo (2 días, diferencial competitivo visible).
3. **Settings screen completo** tercero (3 días, necesario para darle contexto a las opciones anteriores).
4. **Tema claro/oscuro desde settings** (ya existe la lógica de tema, solo falta exponerlo en la UI).

---

## Apéndice — Resumen de Acciones Priorizadas

### Acciones inmediatas (esta semana)

| Acción | Área | Tiempo |
|--------|------|--------|
| Agregar CHECK constraint en `users` para prevenir write de score/level desde cliente | Seguridad | 2h |
| Agregar CHECK de fecha futura en `habit_completions` | Seguridad | 30min |
| Verificar RLS en `streak_freezes` | Seguridad | 30min |
| Agregar índices en `habit_completions` | Performance | 15min |
| Verificar `.env` en `.gitignore` | Seguridad | 10min |

### Acciones V3 (próximas 6 semanas)

| Acción | Área | Tiempo |
|--------|------|--------|
| Mover cálculo de score a Edge Function | Arquitectura + Seguridad | 1 día |
| Pantalla de detalle de hábito | UX | 2 días |
| Nota al completar | UX | 1 día |
| Settings screen + avatar emoji + color acento | UX / Personalización | 5 días |
| Quick-add desde Hoy | UX | 2 días |
| Celebración día perfecto | UX / Engagement | 2 días |
| Onboarding mejorado con plantillas | UX / Activación | 2 días |
| Alertas de abandono (client-side primero) | Retención | 3 días |

### Iniciativas de mediano plazo (V4+)

| Acción | Área | Tiempo |
|--------|------|--------|
| Backoffice Next.js MVP | Analytics / Ops | 3–4 semanas |
| Rebranding Violet Warm | Diseño | 1 semana |
| Hábitos medibles con UI | Product | 4 días |
| Frecuencias no diarias | Product | 10 días |
| Mood tracking | Product | 5 días |
| Widget OS | Engagement | 10 días |

---

*Documento generado el 2026-04-21 — versión 1.0*  
*Próxima revisión recomendada: al iniciar desarrollo de V3*
