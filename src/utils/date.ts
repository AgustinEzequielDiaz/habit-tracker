import { format, startOfDay, subDays, eachDayOfInterval, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// ─────────────────────────────────────────
// Formateo de fechas
// ─────────────────────────────────────────

export function toDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayString(): string {
  return toDateString(new Date())
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, "d 'de' MMMM", { locale: es })
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: es })
}

export function formatDayOfWeek(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE', { locale: es })
}

export function formatTime(timeStr: string): string {
  // HH:MM:SS → HH:MM
  return timeStr.substring(0, 5)
}

// ─────────────────────────────────────────
// Rangos de fechas
// ─────────────────────────────────────────

export function getLast365Days(): string[] {
  const today = startOfDay(new Date())
  const start = subDays(today, 364)
  return eachDayOfInterval({ start, end: today }).map(toDateString)
}

export function getLast30Days(): string[] {
  const today = startOfDay(new Date())
  const start = subDays(today, 29)
  return eachDayOfInterval({ start, end: today }).map(toDateString)
}

export function getLast7Days(): string[] {
  const today = startOfDay(new Date())
  const start = subDays(today, 6)
  return eachDayOfInterval({ start, end: today }).map(toDateString)
}

// ─────────────────────────────────────────
// Utilidades de semana
// ─────────────────────────────────────────

export function getWeekDays(referenceDate: Date = new Date()): string[] {
  const day = referenceDate.getDay() // 0=domingo
  const monday = subDays(referenceDate, day === 0 ? 6 : day - 1)
  return Array.from({ length: 7 }, (_, i) => toDateString(subDays(monday, -i)))
}

// ─────────────────────────────────────────
// Helpers para streaks y comparaciones
// ─────────────────────────────────────────

export function isDateInPast(dateStr: string): boolean {
  return dateStr < todayString()
}

export function daysDifference(dateA: string, dateB: string): number {
  const a = parseISO(dateA)
  const b = parseISO(dateB)
  return Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)))
}

export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

export function isConsecutive(dateA: string, dateB: string): boolean {
  return daysDifference(dateA, dateB) === 1
}
