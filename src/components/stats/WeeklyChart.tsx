import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { DailySummary } from '@/types'
import { getLast7Days, formatShortDate } from '@/utils/date'

interface WeeklyChartProps {
  summaries: DailySummary[]
}

// Altura máxima de las barras en puntos
const BAR_MAX_HEIGHT = 120
const BAR_WIDTH = 32

export function WeeklyChart({ summaries }: WeeklyChartProps) {
  const { colors, isDark } = useTheme()

  const last7 = getLast7Days()
  const summaryMap = new Map(summaries.map((s) => [s.summary_date, s]))

  const barData = last7.map((dateStr) => {
    const summary = summaryMap.get(dateStr)
    const rate = summary ? Math.round(summary.completion_rate) : 0
    // Solo la primera letra del día abreviado (l, m, m, j, v, s, d)
    const label = formatShortDate(dateStr).split(' ')[0].charAt(0).toUpperCase()

    let color = colors.primary
    if (rate === 0) color = isDark ? '#3A3A3A' : '#E5E7EB'
    else if (rate < 50) color = colors.warning
    else if (rate >= 100) color = colors.success

    return { rate, label, color, dateStr }
  })

  const avg = barData.reduce((s, d) => s + d.rate, 0) / 7

  const trend = (() => {
    const firstHalf = barData.slice(0, 3).reduce((s, d) => s + d.rate, 0) / 3
    const secondHalf = barData.slice(4).reduce((s, d) => s + d.rate, 0) / 3
    const diff = secondHalf - firstHalf
    if (diff > 8)  return { label: '↑ En alza',   color: colors.success }
    if (diff < -8) return { label: '↓ A la baja', color: colors.error }
    return          { label: '→ Estable',           color: colors.textSecondary }
  })()

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>Promedio semanal</Text>
          <Text style={[styles.avgValue, { color: colors.text }]}>{Math.round(avg)}%</Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${trend.color}18` }]}>
          <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
        </View>
      </View>

      {/* Barras */}
      <View style={styles.chartArea}>
        {/* Líneas de referencia */}
        {[100, 75, 50, 25].map((pct) => (
          <View
            key={pct}
            style={[
              styles.gridLine,
              {
                bottom: (pct / 100) * BAR_MAX_HEIGHT,
                borderColor: isDark ? '#2E2E2E' : '#F3F4F6',
              },
            ]}
          />
        ))}

        {/* Barras */}
        <View style={styles.barsRow}>
          {barData.map((bar) => {
            const barHeight = Math.max(3, (bar.rate / 100) * BAR_MAX_HEIGHT)
            return (
              <View key={bar.dateStr} style={styles.barWrapper}>
                {/* Porcentaje encima de la barra */}
                {bar.rate > 0 && (
                  <Text style={[styles.barTopLabel, { color: colors.textSecondary }]}>
                    {bar.rate}%
                  </Text>
                )}
                {/* Contenedor de la barra */}
                <View style={[styles.barTrack, { height: BAR_MAX_HEIGHT }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        width: BAR_WIDTH,
                        backgroundColor: bar.color,
                      },
                    ]}
                  />
                </View>
                {/* Etiqueta del día */}
                <Text style={[styles.barDayLabel, { color: colors.textSecondary }]}>
                  {bar.label}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        {[
          { color: colors.success,   label: 'Perfecto (100%)' },
          { color: colors.primary,   label: 'Completado' },
          { color: colors.warning,   label: 'Parcial (<50%)' },
          { color: isDark ? '#3A3A3A' : '#E5E7EB', label: 'Sin datos' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  avgLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  avgValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  trendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  chartArea: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTopLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  barTrack: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    borderRadius: radius.sm,
  },
  barDayLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: typography.sizes.xs,
  },
})
