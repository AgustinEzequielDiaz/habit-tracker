import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { DailySummary } from '@/types'
import { useTheme } from '@/hooks/useTheme'
import { typography, spacing, radius } from '@/constants/theme'
import { getLast365Days, formatShortDate } from '@/utils/date'
import { heatmapIntensity } from '@/utils/scoring'

interface HeatmapGridProps {
  summaries: DailySummary[]
  onDayPress?: (summary: DailySummary | null, date: string) => void
}

const CELL_SIZE = 13
const CELL_GAP = 3
const WEEKS_TO_SHOW = 52
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function HeatmapGrid({ summaries, onDayPress }: HeatmapGridProps) {
  const { colors } = useTheme()

  const summaryMap = useMemo(() => {
    const map = new Map<string, DailySummary>()
    for (const s of summaries) map.set(s.summary_date, s)
    return map
  }, [summaries])

  const last365 = useMemo(() => getLast365Days(), [])

  // Organizar en semanas (columnas)
  const weeks = useMemo(() => {
    const result: (string | null)[][] = []
    const total = last365.length

    // Determinar qué día de la semana es el primer día
    const firstDate = new Date(last365[0])
    const firstDayOfWeek = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1 // 0=lunes

    // Rellenar días vacíos al inicio
    const allDays: (string | null)[] = Array(firstDayOfWeek).fill(null).concat(last365)

    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7)
      while (week.length < 7) week.push(null)
      result.push(week)
    }

    return result.slice(-WEEKS_TO_SHOW)
  }, [last365])

  const intensityColors = [
    colors.heatmap.empty,
    colors.heatmap.low,
    colors.heatmap.medium,
    colors.heatmap.high,
  ]

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Etiquetas de días */}
        <View style={styles.dayLabels}>
          {DAYS.map((day, i) => (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                { color: colors.textSecondary, height: CELL_SIZE + CELL_GAP },
              ]}
            >
              {i % 2 === 0 ? day : ''}
            </Text>
          ))}
        </View>

        {/* Semanas */}
        <View style={styles.weeks}>
          {weeks.map((week, wi) => (
            <View key={wi} style={[styles.week, { gap: CELL_GAP }]}>
              {week.map((date, di) => {
                if (!date) {
                  return (
                    <View
                      key={di}
                      style={[
                        styles.cell,
                        { backgroundColor: 'transparent' },
                      ]}
                    />
                  )
                }

                const summary = summaryMap.get(date) ?? null
                const intensity = summary
                  ? heatmapIntensity(summary.completion_rate / 100)
                  : 0

                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => onDayPress?.(summary, date)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: intensityColors[intensity],
                        borderRadius: radius.xs,
                      },
                    ]}
                  />
                )
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Menos</Text>
        {intensityColors.map((c, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: c, borderRadius: radius.xs }]}
          />
        ))}
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Más</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayLabels: {
    gap: CELL_GAP,
    paddingTop: 2,
  },
  dayLabel: {
    fontSize: typography.sizes.xs - 1,
    width: 10,
    textAlign: 'center',
  },
  weeks: {
    flexDirection: 'row',
    gap: CELL_GAP,
    flex: 1,
  },
  week: {
    flexDirection: 'column',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  legendText: {
    fontSize: typography.sizes.xs,
  },
})
