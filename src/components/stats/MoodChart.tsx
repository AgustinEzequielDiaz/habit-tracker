import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg'
import { useTheme } from '@/hooks/useTheme'
import { useMoodStore, MoodEntry } from '@/stores/mood.store'
import { spacing, typography, radius } from '@/constants/theme'
import { getLast30Days, formatShortDate } from '@/utils/date'
import { DailySummary } from '@/types'

interface MoodChartProps {
  summaries: DailySummary[]
}

// ─── Constantes del gráfico ───────────────────────────────────
const CHART_WIDTH  = 320
const CHART_HEIGHT = 130
const PAD_LEFT     = 28
const PAD_RIGHT    = 8
const PAD_TOP      = 10
const PAD_BOTTOM   = 20
const INNER_W = CHART_WIDTH  - PAD_LEFT - PAD_RIGHT
const INNER_H = CHART_HEIGHT - PAD_TOP  - PAD_BOTTOM

const MOOD_EMOJIS: Record<number, string> = { 1: '😫', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' }

function moodLabel(avg: number | null): string {
  if (avg === null) return '—'
  const rounded = Math.round(avg)
  return `${MOOD_EMOJIS[rounded] ?? ''} ${avg.toFixed(1)}`
}

// Construye el atributo `d` de un <Path> a partir de puntos (x, y)
// Saltea gaps cuando no hay dato (valor null)
function buildPath(points: Array<{ x: number; y: number } | null>): string {
  let d = ''
  let penDown = false
  for (const pt of points) {
    if (pt === null) {
      penDown = false
      continue
    }
    if (!penDown) {
      d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `
      penDown = true
    } else {
      d += `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `
    }
  }
  return d
}

export function MoodChart({ summaries }: MoodChartProps) {
  const { colors, isDark } = useTheme()
  const moodHistory = useMoodStore((s) => s.history)

  // ── Preparar datos ────────────────────────────────────────────
  const last30 = useMemo(() => getLast30Days(), [])

  const { completionPoints, moodPoints, avgMood, avgCompletion, correlation } = useMemo(() => {
    const summaryMap  = new Map(summaries.map((s) => [s.summary_date, s]))
    const moodMap     = new Map(moodHistory.map((e: MoodEntry) => [e.date, e.mood]))

    const N = last30.length
    let sumMood = 0, cntMood = 0, sumComp = 0, cntComp = 0
    let sumMoodComp = 0, cntBoth = 0

    const cPoints: Array<{ x: number; y: number } | null> = []
    const mPoints: Array<{ x: number; y: number } | null> = []

    last30.forEach((dateStr, i) => {
      const xRatio = N > 1 ? i / (N - 1) : 0
      const x = PAD_LEFT + xRatio * INNER_W

      // Completion rate
      const summary = summaryMap.get(dateStr)
      if (summary && summary.completion_rate !== undefined) {
        const rate = Math.min(100, Math.max(0, summary.completion_rate))
        const y = PAD_TOP + (1 - rate / 100) * INNER_H
        cPoints.push({ x, y })
        sumComp += rate; cntComp++
      } else {
        cPoints.push(null)
      }

      // Mood (normalizado a 0-100)
      const mood = moodMap.get(dateStr)
      if (mood !== undefined) {
        const normalized = ((mood - 1) / 4) * 100    // 1→0%, 5→100%
        const y = PAD_TOP + (1 - normalized / 100) * INNER_H
        mPoints.push({ x, y })
        sumMood += mood; cntMood++
      } else {
        mPoints.push(null)
      }

      // Correlación simple: pares con ambos datos
      if (summary && moodMap.has(dateStr)) {
        const rate = Math.min(100, Math.max(0, summary.completion_rate))
        sumMoodComp += (moodMap.get(dateStr)! / 5) * rate
        cntBoth++
      }
    })

    const avgMood       = cntMood > 0   ? sumMood / cntMood         : null
    const avgCompletion = cntComp > 0   ? sumComp / cntComp         : 0

    // Correlación muy simple: si avg mood y avg completion se mueven juntos
    let correlation: 'positive' | 'negative' | 'neutral' | null = null
    if (cntBoth >= 5 && avgMood !== null) {
      const moodNorm = (avgMood - 1) / 4 * 100
      const diff = moodNorm - avgCompletion
      if (diff > 15)       correlation = 'positive'
      else if (diff < -15) correlation = 'negative'
      else                  correlation = 'neutral'
    }

    return { completionPoints: cPoints, moodPoints: mPoints, avgMood, avgCompletion, correlation }
  }, [last30, summaries, moodHistory])

  const hasData = completionPoints.some(Boolean) || moodPoints.some(Boolean)

  // ── Colores de las líneas ──────────────────────────────────────
  const completionColor = colors.primary
  const moodColor       = '#F43F5E'   // rose-500, fijo para todas las paletas
  const gridColor       = isDark ? '#2A2A2A' : '#F0F0F0'
  const labelColor      = isDark ? '#888'   : '#999'

  // ── Etiquetas X: cada 7 días ──────────────────────────────────
  const xLabels = last30
    .map((d, i) => ({ i, d }))
    .filter(({ i }) => i === 0 || (i + 1) % 7 === 0 || i === last30.length - 1)

  // ── Paths ────────────────────────────────────────────────────
  const cPath = buildPath(completionPoints)
  const mPath = buildPath(moodPoints)

  // ── Insight de correlación ────────────────────────────────────
  const correlationText =
    correlation === 'positive' ? '😊 Cuando tu mood es alto, completás más hábitos.' :
    correlation === 'negative' ? '📉 Tu mood está por encima de tu ritmo de hábitos. ¡Aprovechalo!' :
    correlation === 'neutral'  ? '⚖️ Tu mood y hábitos van en sintonía.' :
    null

  return (
    <View>
      {/* ── Header con stats ── */}
      <View style={styles.header}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mood promedio</Text>
          <Text style={[styles.statValue, { color: moodColor }]}>{moodLabel(avgMood)}</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completions prom.</Text>
          <Text style={[styles.statValue, { color: completionColor }]}>{Math.round(avgCompletion)}%</Text>
        </View>
      </View>

      {/* ── Gráfico SVG ── */}
      {hasData ? (
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = PAD_TOP + (1 - pct / 100) * INNER_H
            return (
              <React.Fragment key={pct}>
                <Line
                  x1={PAD_LEFT} y1={y}
                  x2={CHART_WIDTH - PAD_RIGHT} y2={y}
                  stroke={gridColor} strokeWidth={1}
                />
                <SvgText
                  x={PAD_LEFT - 4} y={y + 3.5}
                  fontSize={8} fill={labelColor}
                  textAnchor="end"
                >
                  {pct}
                </SvgText>
              </React.Fragment>
            )
          })}

          {/* Línea de completions */}
          {cPath ? (
            <Path d={cPath} stroke={completionColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}

          {/* Línea de mood */}
          {mPath ? (
            <Path d={mPath} stroke={moodColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
          ) : null}

          {/* Dots de completions (solo cuando hay dato) */}
          {completionPoints.map((pt, i) =>
            pt ? (
              <Circle key={`c${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={completionColor} />
            ) : null
          )}

          {/* Dots de mood */}
          {moodPoints.map((pt, i) =>
            pt ? (
              <Circle key={`m${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={moodColor} />
            ) : null
          )}

          {/* Etiquetas X */}
          {xLabels.map(({ i, d }) => {
            const xRatio = last30.length > 1 ? i / (last30.length - 1) : 0
            const x = PAD_LEFT + xRatio * INNER_W
            const label = formatShortDate(d).replace('.', '')
            return (
              <SvgText
                key={d}
                x={x} y={CHART_HEIGHT - 3}
                fontSize={8} fill={labelColor}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            )
          })}
        </Svg>
      ) : (
        <View style={[styles.emptyChart, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Registrá tu mood durante unos días para ver el gráfico
          </Text>
        </View>
      )}

      {/* ── Leyenda ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: completionColor }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Completions</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { borderColor: moodColor }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Mood</Text>
        </View>
      </View>

      {/* ── Insight de correlación ── */}
      {correlationText && (
        <View style={[styles.correlationCard, { backgroundColor: `${colors.primary}12` }]}>
          <Text style={[styles.correlationText, { color: colors.textSecondary }]}>
            {correlationText}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statCol: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  svg: {
    alignSelf: 'center',
  },
  emptyChart: {
    height: CHART_HEIGHT,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  legendDash: {
    width: 18,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  correlationCard: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  correlationText: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
})
