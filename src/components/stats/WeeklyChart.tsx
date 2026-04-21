import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography } from '@/constants/theme'
import { DailySummary } from '@/types'
import { getLast7Days, formatShortDate } from '@/utils/date'

interface WeeklyChartProps {
  summaries: DailySummary[]
}

export function WeeklyChart({ summaries }: WeeklyChartProps) {
  const { colors, isDark } = useTheme()

  const last7 = getLast7Days()
  const summaryMap = new Map(summaries.map((s) => [s.summary_date, s]))

  const barData = last7.map((dateStr) => {
    const summary = summaryMap.get(dateStr)
    const rate = summary ? Math.round(summary.completion_rate) : 0
    const label = formatShortDate(dateStr).split(' ')[0] // "lun", "mar"…

    // Color dinámico según el rate
    let frontColor = colors.primary
    if (rate === 0) frontColor = isDark ? '#3A3A3A' : '#E5E7EB'
    else if (rate < 50) frontColor = colors.warning
    else if (rate >= 100) frontColor = colors.success

    return {
      value: rate,
      label,
      frontColor,
      topLabelComponent: rate > 0
        ? () => (
            <Text style={[styles.barTopLabel, { color: colors.textSecondary }]}>
              {rate}%
            </Text>
          )
        : undefined,
    }
  })

  const avg = last7.reduce((sum, d) => {
    const s = summaryMap.get(d)
    return sum + (s ? s.completion_rate : 0)
  }, 0) / 7

  const trend = (() => {
    const firstHalf = last7.slice(0, 3).reduce((sum, d) => {
      const s = summaryMap.get(d)
      return sum + (s ? s.completion_rate : 0)
    }, 0) / 3
    const secondHalf = last7.slice(4).reduce((sum, d) => {
      const s = summaryMap.get(d)
      return sum + (s ? s.completion_rate : 0)
    }, 0) / 3
    const diff = secondHalf - firstHalf
    if (diff > 10) return { label: '↑ En alza', color: colors.success }
    if (diff < -10) return { label: '↓ A la baja', color: colors.error }
    return { label: '→ Estable', color: colors.textSecondary }
  })()

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>Promedio semanal</Text>
          <Text style={[styles.avgValue, { color: colors.text }]}>
            {Math.round(avg)}%
          </Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: `${trend.color}18` }]}>
          <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartWrap}>
        <BarChart
          data={barData}
          height={140}
          barWidth={32}
          spacing={10}
          roundedTop
          noOfSections={4}
          maxValue={100}
          hideRules={false}
          rulesColor={isDark ? '#2E2E2E' : '#F3F4F6'}
          rulesType="solid"
          yAxisThickness={0}
          xAxisThickness={0}
          hideYAxisText
          xAxisLabelTextStyle={[styles.xLabel, { color: colors.textSecondary }]}
          isAnimated
          animationDuration={600}
        />
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        {[
          { color: colors.success, label: 'Día perfecto' },
          { color: colors.primary, label: 'Completado' },
          { color: colors.warning, label: 'Parcial' },
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
    marginBottom: spacing.md,
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
  chartWrap: {
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  barTopLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  xLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
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
