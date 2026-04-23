import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { toDateString, todayString, formatShortDate } from '@/utils/date'
import { subDays, addDays, startOfWeek, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Habit, HabitCompletion } from '@/types'

// ── Helpers ──────────────────────────────────────────────────
function getWeekRange(ref: Date): { start: Date; end: Date; days: Date[] } {
  // Semana lunes-domingo
  const day = ref.getDay() // 0 = domingo
  const monday = subDays(ref, day === 0 ? 6 : day - 1)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  return { start: days[0], end: days[6], days }
}

function getDayLabel(date: Date): string {
  return format(date, 'EEE', { locale: es })
}

function getWeekTitle(days: Date[]): string {
  const start = format(days[0], "d MMM", { locale: es })
  const end = format(days[6], "d MMM", { locale: es })
  const year = format(days[0], 'yyyy')
  return `${start} – ${end}, ${year}`
}

// ── Celda de un día ──────────────────────────────────────────
interface DayColumnProps {
  date: Date
  habits: Habit[]
  completionsByDate: Map<string, HabitCompletion[]>
  isToday: boolean
  isPast: boolean
}

function DayColumn({ date, habits, completionsByDate, isToday, isPast }: DayColumnProps) {
  const { colors } = useTheme()
  const dateStr = toDateString(date)
  const dayCompletions = completionsByDate.get(dateStr) ?? []
  const completedIds = new Set(dayCompletions.map((c) => c.habit_id))
  const completedCount = completedIds.size
  const totalCount = habits.length
  const rate = totalCount > 0 ? completedCount / totalCount : 0

  const dayBg = isToday
    ? `${colors.primary}12`
    : 'transparent'

  const dayBorderColor = isToday ? colors.primary : colors.border

  return (
    <View style={[styles.dayColumn, { borderColor: dayBorderColor, backgroundColor: dayBg }]}>
      {/* Header del día */}
      <View style={[styles.dayHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.dayName, { color: isToday ? colors.primary : colors.textSecondary }]}>
          {getDayLabel(date).toUpperCase()}
        </Text>
        <Text style={[styles.dayNum, {
          color: isToday ? colors.primary : colors.text,
          fontWeight: isToday ? '800' : '600',
        }]}>
          {format(date, 'd')}
        </Text>
        {/* Mini progreso */}
        {totalCount > 0 && (isPast || isToday) && (
          <View style={[styles.dayProgress, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.dayProgressFill,
                {
                  backgroundColor: rate >= 1 ? colors.success : rate > 0 ? colors.primary : colors.border,
                  height: `${Math.round(rate * 100)}%`,
                },
              ]}
            />
          </View>
        )}
        {totalCount > 0 && (isPast || isToday) && (
          <Text style={[styles.dayRateText, {
            color: rate >= 1 ? colors.success : rate > 0.5 ? colors.primary : colors.textSecondary,
          }]}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>

      {/* Lista de hábitos */}
      <View style={styles.habitList}>
        {habits.map((habit) => {
          const done = completedIds.has(habit.id)
          return (
            <View
              key={habit.id}
              style={[
                styles.habitDot,
                {
                  backgroundColor: done ? habit.color : colors.surface,
                  borderColor: done ? habit.color : colors.border,
                  opacity: !isPast && !isToday ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.habitDotText} numberOfLines={1}>
                {done ? '✓' : '·'}
              </Text>
            </View>
          )
        })}
        {habits.length === 0 && (
          <Text style={[styles.noHabits, { color: colors.textDisabled }]}>–</Text>
        )}
      </View>
    </View>
  )
}

// ── Leyenda de hábitos ───────────────────────────────────────
function HabitLegend({ habits }: { habits: Habit[] }) {
  const { colors } = useTheme()
  if (habits.length === 0) return null
  return (
    <View style={styles.legendContainer}>
      <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>Hábitos</Text>
      <View style={styles.legendList}>
        {habits.map((h) => (
          <View key={h.id} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: h.color }]} />
            <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
              {h.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ── Pantalla principal ───────────────────────────────────────
export default function AgendaScreen() {
  const { colors } = useTheme()
  const { habits, loadHabits, isLoading } = useHabitsStore()
  const { recentCompletions, loadRecentCompletions } = useCompletionsStore()

  const [referenceDate, setReferenceDate] = useState(new Date())

  const loadData = useCallback(async () => {
    await Promise.all([loadHabits(), loadRecentCompletions()])
  }, [loadHabits, loadRecentCompletions])

  useEffect(() => { loadData() }, [loadData])

  const { days } = useMemo(() => getWeekRange(referenceDate), [referenceDate])
  const weekTitle = getWeekTitle(days)
  const todayStr = todayString()

  // Agrupar completions por fecha
  const completionsByDate = useMemo(() => {
    const map = new Map<string, HabitCompletion[]>()
    for (const c of recentCompletions) {
      const list = map.get(c.completed_date) ?? []
      list.push(c)
      map.set(c.completed_date, list)
    }
    return map
  }, [recentCompletions])

  // Resumen de la semana actual
  const weekSummary = useMemo(() => {
    if (habits.length === 0) return null
    const currentWeekDays = days.map((d) => toDateString(d))
    const pastDays = currentWeekDays.filter((d) => d <= todayStr)
    if (pastDays.length === 0) return null

    let totalPossible = 0
    let totalCompleted = 0
    for (const dateStr of pastDays) {
      const dayCompletions = completionsByDate.get(dateStr) ?? []
      totalPossible += habits.length
      totalCompleted += dayCompletions.filter((c) =>
        habits.some((h) => h.id === c.habit_id)
      ).length
    }
    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
    return { completed: totalCompleted, possible: totalPossible, rate, days: pastDays.length }
  }, [days, habits, completionsByDate, todayStr])

  const goToPrevWeek = () => setReferenceDate((d) => subDays(d, 7))
  const goToNextWeek = () => setReferenceDate((d) => addDays(d, 7))
  const goToToday = () => setReferenceDate(new Date())
  const isCurrentWeek = toDateString(days[0]) <= todayStr && todayStr <= toDateString(days[6])

  if (isLoading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Agenda</Text>

          {/* Navegación de semana */}
          <View style={styles.weekNav}>
            <TouchableOpacity
              onPress={goToPrevWeek}
              style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.navBtnText, { color: colors.text }]}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goToToday} style={styles.weekTitleWrapper}>
              <Text style={[styles.weekTitle, { color: colors.text }]}>{weekTitle}</Text>
              {!isCurrentWeek && (
                <Text style={[styles.todayLink, { color: colors.primary }]}>Ir a hoy →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextWeek}
              style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.navBtnText, { color: colors.text }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen de la semana */}
        {weekSummary && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{weekSummary.rate}%</Text>
                <Text style={[styles.summaryLbl, { color: colors.textSecondary }]}>cumplimiento</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {weekSummary.completed}/{weekSummary.possible}
                </Text>
                <Text style={[styles.summaryLbl, { color: colors.textSecondary }]}>completados</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: colors.text }]}>{weekSummary.days}</Text>
                <Text style={[styles.summaryLbl, { color: colors.textSecondary }]}>días activos</Text>
              </View>
            </View>
            {/* Barra de progreso semanal */}
            <View style={[styles.weekProgressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.weekProgressFill,
                  {
                    backgroundColor: weekSummary.rate >= 80 ? colors.success : colors.primary,
                    width: `${weekSummary.rate}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Grid de 7 días */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gridScroll}
        >
          {days.map((date) => {
            const dateStr = toDateString(date)
            const isT = dateStr === todayStr
            const isPast = dateStr < todayStr
            return (
              <DayColumn
                key={dateStr}
                date={date}
                habits={habits}
                completionsByDate={completionsByDate}
                isToday={isT}
                isPast={isPast}
              />
            )
          })}
        </ScrollView>

        {/* Leyenda */}
        <HabitLegend habits={habits} />

        {/* Empty state */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin hábitos todavía</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Creá tus primeros hábitos en la pestaña Hábitos
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: { gap: spacing.md },
  screenTitle: {
    fontSize: typography.sizes.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  weekTitleWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  todayLink: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  // ── Summary card ──
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  summaryVal: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryLbl: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  weekProgressTrack: {
    height: 5,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  weekProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  // ── Grid ──
  gridScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  dayColumn: {
    width: 88,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  dayName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dayNum: {
    fontSize: typography.sizes.xl,
    lineHeight: 26,
  },
  dayProgress: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  dayProgressFill: {
    width: '100%',
    borderRadius: 14,
  },
  dayRateText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  // ── Habit dots ──
  habitList: {
    padding: spacing.sm,
    gap: 4,
  },
  habitDot: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  habitDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  noHabits: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
  },
  // ── Legend ──
  legendContainer: {
    gap: spacing.sm,
  },
  legendTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  legendList: {
    gap: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  // ── Empty ──
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
})
