import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import {
  aiInsightsService,
  AIInsight,
  AIInsightsError,
  AIErrorCode,
  InsightType,
} from '@/services/ai-insights.service'

// ─── Configuración visual por tipo de insight ─────────────────

interface InsightConfig {
  emoji: string
  bgKey: keyof ReturnType<typeof useTheme>['colors']
  textKey: keyof ReturnType<typeof useTheme>['colors']
  label: string
}

const INSIGHT_CONFIG: Record<InsightType, InsightConfig> = {
  achievement: { emoji: '🏆', bgKey: 'success',  textKey: 'success',  label: 'Logro'    },
  tip:         { emoji: '💡', bgKey: 'primary',  textKey: 'primary',  label: 'Consejo'  },
  warning:     { emoji: '⚠️', bgKey: 'warning',  textKey: 'warning',  label: 'Atención' },
  challenge:   { emoji: '🎯', bgKey: 'streak',   textKey: 'streak',   label: 'Desafío'  },
}

// ─── Mapeo de errores a UI amigable ───────────────────────────
//
// Principio: el usuario nunca ve detalles técnicos (nombres de API,
// códigos HTTP, mensajes de OpenAI). Solo ve qué pasó y qué hacer.
//
// canRetry: true  → mostrar botón "Reintentar"
// canRetry: false → error de config/saldo, reintentar no sirve

interface ErrorUI {
  emoji: string
  title: string
  subtitle: string
  canRetry: boolean
}

const ERROR_UI: Record<AIErrorCode, ErrorUI> = {
  // Error de configuración del servidor — el usuario no puede resolverlo
  key_missing: {
    emoji: '🔧',
    title: 'Función de IA no disponible',
    subtitle: 'El servicio de sugerencias no está activado todavía.',
    canRetry: false,
  },
  // Key revocada o inválida — idem
  key_invalid: {
    emoji: '🔧',
    title: 'Función de IA no disponible',
    subtitle: 'El servicio de sugerencias no está activado todavía.',
    canRetry: false,
  },
  // Sin crédito: error permanente hasta que se recargue la cuenta
  quota_exceeded: {
    emoji: '⏸️',
    title: 'Sugerencias pausadas por hoy',
    subtitle: 'El límite de uso de IA se alcanzó. Las sugerencias estarán disponibles mañana o cuando se renueve el plan.',
    canRetry: false,
  },
  // Rate limit: error temporal, reintentar en unos minutos
  rate_limit: {
    emoji: '⏱️',
    title: 'Demasiadas consultas seguidas',
    subtitle: 'Esperá unos minutos y volvé a intentarlo.',
    canRetry: true,
  },
  // OpenAI 5xx: servicio caído, puede resolverse solo
  openai_unavailable: {
    emoji: '🌐',
    title: 'Servicio de IA temporalmente fuera de línea',
    subtitle: 'OpenAI está experimentando problemas. Intentá de nuevo en unos minutos.',
    canRetry: true,
  },
  // Timeout: probablemente transitorio
  openai_timeout: {
    emoji: '⌛',
    title: 'La IA tardó demasiado en responder',
    subtitle: 'Intentá de nuevo. Si sigue pasando, probá más tarde.',
    canRetry: true,
  },
  // Respuesta malformada: puede ser transitorio
  parse_error: {
    emoji: '🤔',
    title: 'Respuesta inesperada de la IA',
    subtitle: 'La IA devolvió algo que no pudimos interpretar. Intentá de nuevo.',
    canRetry: true,
  },
  // Sin sesión: muy raro, la app normalmente hace refresh automático
  no_auth: {
    emoji: '🔒',
    title: 'Sesión expirada',
    subtitle: 'Cerrá sesión y volvé a ingresar para ver tus sugerencias.',
    canRetry: false,
  },
  // Sin internet
  network_error: {
    emoji: '📶',
    title: 'Sin conexión a internet',
    subtitle: 'Verificá tu conexión y volvé a intentarlo.',
    canRetry: true,
  },
  // Error genérico del servidor
  internal_error: {
    emoji: '😕',
    title: 'Error al generar sugerencias',
    subtitle: 'Algo salió mal de nuestro lado. Intentá de nuevo más tarde.',
    canRetry: true,
  },
  // Fallback
  unknown: {
    emoji: '😕',
    title: 'Error al cargar sugerencias',
    subtitle: 'Intentá de nuevo. Si el problema persiste, cerrá y reabrí la app.',
    canRetry: true,
  },
}

// ─── Skeleton de carga ────────────────────────────────────────

function InsightSkeleton() {
  const { colors, isDark } = useTheme()
  const shimmer = isDark ? '#2A2A2A' : '#F0F0F0'
  const bar     = isDark ? '#333'    : '#E0E0E0'
  return (
    <View style={[styles.skeletonCard, { backgroundColor: shimmer }]}>
      <View style={[styles.skeletonCircle, { backgroundColor: bar }]} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { backgroundColor: bar, width: '60%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: bar, width: '90%', height: 10, marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: bar, width: '75%', height: 10, marginTop: 4 }]} />
      </View>
    </View>
  )
}

// ─── Tarjeta de un insight ─────────────────────────────────────

function InsightItem({ insight }: { insight: AIInsight }) {
  const { colors } = useTheme()
  const config     = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.tip
  const accent     = colors[config.bgKey] as string

  return (
    <View style={[styles.insightCard, { backgroundColor: `${accent}12`, borderLeftColor: accent }]}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightEmoji}>{config.emoji}</Text>
        <View style={styles.insightTitleBlock}>
          <Text style={[styles.insightBadge, { color: accent }]}>{config.label}</Text>
          <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
        </View>
      </View>
      <Text style={[styles.insightBody, { color: colors.textSecondary }]}>{insight.body}</Text>
    </View>
  )
}

// ─── Componente principal ─────────────────────────────────────

interface AIInsightsCardProps {
  /** Si es true, muestra solo el primer insight (modo compacto para Hoy) */
  compact?: boolean
}

export function AIInsightsCard({ compact = false }: AIInsightsCardProps) {
  const { colors } = useTheme()

  const [insights, setInsights]           = useState<AIInsight[]>([])
  const [loading, setLoading]             = useState(false)
  const [errorUI, setErrorUI]             = useState<ErrorUI | null>(null)
  const [loaded, setLoaded]               = useState(false)
  const [cached, setCached]               = useState(false)
  const [generatedDate, setGeneratedDate] = useState<string | null>(null)

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setErrorUI(null)
    try {
      const res = await aiInsightsService.fetchInsights(forceRefresh)
      setInsights(res.insights)
      setCached(res.cached)
      setGeneratedDate(res.generatedDate)
      setLoaded(true)
    } catch (err) {
      // Mapear al UI de error correcto según el código
      const code: AIErrorCode =
        err instanceof AIInsightsError ? err.code : 'unknown'
      setErrorUI(ERROR_UI[code] ?? ERROR_UI.unknown)
      // Si había insights cacheados previamente, los mantenemos visibles
      // (solo resetear si no hay nada que mostrar)
      if (!loaded) setLoaded(false)
    } finally {
      setLoading(false)
    }
  }, [loaded])

  const displayInsights = compact ? insights.slice(0, 1) : insights

  // ── Estado: sin cargar ─────────────────────────────────────────
  if (!loaded && !loading && !errorUI) {
    return (
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
        onPress={() => load()}
        activeOpacity={0.75}
      >
        <Text style={styles.ctaEmoji}>🤖</Text>
        <View style={styles.ctaBody}>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            {compact ? 'Ver mi sugerencia de hoy' : 'Analizar mi progreso con IA'}
          </Text>
          <Text style={[styles.ctaSubtitle, { color: colors.textSecondary }]}>
            GPT-4o-mini · Actualiza 1×/día · Gratis para vos
          </Text>
        </View>
        <Text style={[styles.ctaArrow, { color: colors.primary }]}>→</Text>
      </TouchableOpacity>
    )
  }

  // ── Estado: cargando ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        {compact ? <InsightSkeleton /> : (
          <><InsightSkeleton /><InsightSkeleton /><InsightSkeleton /></>
        )}
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analizando tus hábitos...
          </Text>
        </View>
      </View>
    )
  }

  // ── Estado: error ──────────────────────────────────────────────
  if (errorUI && displayInsights.length === 0) {
    return (
      <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.errorEmoji}>{errorUI.emoji}</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>{errorUI.title}</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{errorUI.subtitle}</Text>
        {errorUI.canRetry && (
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.primary }]}
            onPress={() => load()}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // ── Estado: sin insights ───────────────────────────────────────
  if (loaded && displayInsights.length === 0) {
    return (
      <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.errorEmoji}>📊</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Todavía no hay suficientes datos</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          Registrá tus hábitos durante al menos una semana para recibir sugerencias personalizadas.
        </Text>
      </View>
    )
  }

  // ── Estado: con insights ───────────────────────────────────────
  return (
    <View style={styles.container}>
      {displayInsights.map((insight, i) => (
        <InsightItem key={i} insight={insight} />
      ))}

      {/* Banner de error no crítico sobre insights existentes (ej: fallo de refresh) */}
      {errorUI && loaded && displayInsights.length > 0 && (
        <View style={[styles.softError, { backgroundColor: `${colors.warning}15` }]}>
          <Text style={[styles.softErrorText, { color: colors.warning }]}>
            {errorUI.emoji} {errorUI.subtitle}
            {errorUI.canRetry ? ' Mostrando el último análisis guardado.' : ''}
          </Text>
        </View>
      )}

      {/* Footer: fecha + botón actualizar */}
      {!compact && (
        <View style={styles.footer}>
          {generatedDate && (
            <Text style={[styles.footerDate, { color: colors.textSecondary }]}>
              {cached ? '📋 Caché de hoy' : '✨ Generado ahora'} · {generatedDate}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => load(true)}
            disabled={loading}
            style={[styles.refreshBtn, { borderColor: `${colors.primary}40` }]}
          >
            <Text style={[styles.refreshText, { color: colors.primary }]}>
              🔄 Actualizar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ─── Estilos ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: spacing.sm },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  ctaEmoji:    { fontSize: 28 },
  ctaBody:     { flex: 1, gap: 2 },
  ctaTitle:    { fontSize: typography.sizes.sm, fontWeight: '700' },
  ctaSubtitle: { fontSize: typography.sizes.xs, lineHeight: 16 },
  ctaArrow:    { fontSize: typography.sizes.lg, fontWeight: '700' },

  skeletonCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'flex-start',
  },
  skeletonCircle: { width: 36, height: 36, borderRadius: 18 },
  skeletonBody:   { flex: 1, gap: 4 },
  skeletonLine:   { height: 14, borderRadius: 4 },

  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  loadingText: { fontSize: typography.sizes.xs },

  errorCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  errorEmoji:    { fontSize: 32 },
  errorTitle:    { fontSize: typography.sizes.sm, fontWeight: '700', textAlign: 'center' },
  errorSubtitle: { fontSize: typography.sizes.sm, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  retryText: { fontSize: typography.sizes.sm, fontWeight: '600' },

  insightCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    gap: spacing.sm,
  },
  insightHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  insightEmoji:      { fontSize: 22, lineHeight: 28 },
  insightTitleBlock: { flex: 1, gap: 2 },
  insightBadge:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  insightTitle:      { fontSize: typography.sizes.sm, fontWeight: '700', lineHeight: 20 },
  insightBody:       { fontSize: typography.sizes.sm, lineHeight: 20 },

  softError: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  softErrorText: { fontSize: typography.sizes.xs, lineHeight: 18, textAlign: 'center' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerDate:   { fontSize: typography.sizes.xs },
  refreshBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  refreshText: { fontSize: typography.sizes.xs, fontWeight: '600' },
})
