# Habit Tracker — Setup Guide

Stack: React Native + Expo · Supabase · Zustand · TypeScript

---

## Requisitos previos

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Cuenta en [Supabase](https://supabase.com) (free tier alcanza para el MVP)
- Cuenta en [Expo](https://expo.dev) (para builds con EAS)

---

## 1. Instalar dependencias

```bash
npm install
```

---

## 2. Configurar Supabase

### a) Crear el proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Elegir región más cercana (us-east-1 o sa-east-1)
3. Guardar la contraseña de la DB

### b) Ejecutar el schema
En el **SQL Editor** de Supabase, ejecutar en este orden:
1. `supabase/schema.sql` — crea todas las tablas, tipos, índices y triggers
2. `supabase/rls.sql` — activa Row Level Security y crea las políticas

### c) Configurar Auth
En **Authentication → Providers**:
- Email: habilitado (activo por defecto)
- Google: habilitar con Client ID y Secret de Google Cloud Console
- Apple: habilitar con Service ID de Apple Developer (obligatorio para App Store)

### d) Obtener las credenciales
En **Settings → API**:
- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → para GitHub Secrets (cron jobs)

---

## 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completar `.env` con las credenciales de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
EXPO_PUBLIC_POSTHOG_API_KEY=tu-posthog-key  # opcional en MVP
```

---

## 4. Configurar los cron jobs (GitHub Actions)

En el repositorio → **Settings → Secrets and variables → Actions**, agregar:

| Secret | Valor |
|--------|-------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key de Supabase |

Los workflows en `.github/workflows/cron.yml` se ejecutan automáticamente:
- Score diario: todos los días a las 00:05 UTC
- Recordatorios: cada hora

---

## 5. Deployar las Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkear el proyecto
supabase link --project-ref TU_PROJECT_REF

# Deploy de las tres funciones
supabase functions deploy calculate-daily-score
supabase functions deploy sync-offline-queue
supabase functions deploy send-reminders
```

---

## 6. Correr la app en desarrollo

```bash
# Iniciar Metro bundler
npm start

# iOS (requiere Mac + Xcode)
npm run ios

# Android (requiere Android Studio o dispositivo físico)
npm run android
```

Para probar en tu teléfono: instalá la app **Expo Go** y escaneá el QR.

> Las push notifications **no funcionan en Expo Go** — requieren un build de desarrollo con `expo-dev-client`.

---

## 7. Build para producción (EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login con tu cuenta Expo
eas login

# Configurar el proyecto (primera vez)
eas build:configure

# Build de desarrollo (para testear push notifications)
eas build --profile development --platform ios
eas build --profile development --platform android

# Build de producción
eas build --profile production --platform all
```

---

## Estructura del proyecto

```
src/
├── app/            # Pantallas (Expo Router file-based navigation)
│   ├── (auth)/     # Login, Register, Welcome
│   ├── onboarding/ # Flujo de onboarding (3 pasos)
│   └── (main)/     # Tabs: Today, Habits, Stats, Profile
├── components/     # Componentes reutilizables
├── stores/         # Estado global (Zustand)
├── services/       # Llamadas a Supabase y servicios externos
├── hooks/          # Custom hooks
├── utils/          # Utilidades (fechas, scoring, offline queue)
├── constants/      # Theme, achievements, configuración
└── types/          # TypeScript types

supabase/
├── schema.sql              # Tablas, índices, triggers
├── rls.sql                 # Row Level Security
└── functions/              # Edge Functions (Deno)
    ├── calculate-daily-score/
    ├── sync-offline-queue/
    └── send-reminders/
```

---

## Decisiones técnicas clave

| Decisión | Por qué |
|----------|---------|
| Supabase BaaS | Evita mantener backend propio en MVP |
| Expo Managed | Máxima velocidad de desarrollo |
| Zustand | Más simple que Redux, más robusto que Context |
| Offline queue en AsyncStorage | Sin dependencias extra, cubre el 99% del caso real |
| GitHub Actions como cron | Gratis, sin infra adicional |
| RLS en Postgres | Seguridad a nivel de base de datos sin lógica extra |

---

## Roadmap

- **MVP (actual):** Registro de hábitos, score, streaks, dashboard, heatmap, gamificación básica
- **V1:** Gráficos avanzados, notificaciones inteligentes, micro-hábitos, plantillas, frecuencias no diarias
- **V2:** Correlaciones, riesgo de abandono, mood tracking, journal, primeras features sociales
- **Futuro:** IA, grupos, integraciones con calendario, versión web
