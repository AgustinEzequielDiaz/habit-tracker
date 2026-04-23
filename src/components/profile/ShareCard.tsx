import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, {
  Circle, Rect, Defs, LinearGradient, Stop, Path, G, Text as SvgText,
} from 'react-native-svg'

// Fixed dimensions for the share card (portrait, Instagram-friendly)
export const CARD_WIDTH = 360
export const CARD_HEIGHT = 540

// ── Theme definitions ────────────────────────────────────────────────

export type ShareCardThemeId = 'violet' | 'emerald' | 'sunset' | 'ocean' | 'rose'

export interface ShareCardTheme {
  id: ShareCardThemeId
  name: string
  emoji: string
  // Background gradient stops
  bgTop: string
  bgMid: string
  bgBottom: string
  // Glow orb
  glowColor: string
  // Accent / ring
  accentFrom: string
  accentTo: string
  // Heatmap tile colors: empty, low, mid, full
  heatEmpty: string
  heatLow: string
  heatMid: string
  heatFull: string
  // Badge background & border
  badgeBg: string
  badgeBorder: string
  badgeText: string
  // Footer tag
  tagColor: string
  // Level badge bg
  levelBg: string
}

export const SHARE_THEMES: ShareCardTheme[] = [
  {
    id: 'violet',
    name: 'Violet',
    emoji: '💜',
    bgTop: '#1A0533',
    bgMid: '#2D1054',
    bgBottom: '#0F0720',
    glowColor: '#7C3AED',
    accentFrom: '#A78BFA',
    accentTo: '#7C3AED',
    heatEmpty: 'rgba(255,255,255,0.12)',
    heatLow: '#DDD6FE',
    heatMid: '#A78BFA',
    heatFull: '#7C3AED',
    badgeBg: 'rgba(124,58,237,0.40)',
    badgeBorder: 'rgba(167,139,250,0.4)',
    badgeText: '#DDD6FE',
    tagColor: '#A78BFA',
    levelBg: 'rgba(124,58,237,0.50)',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    emoji: '💚',
    bgTop: '#022C22',
    bgMid: '#064E3B',
    bgBottom: '#011714',
    glowColor: '#10B981',
    accentFrom: '#6EE7B7',
    accentTo: '#059669',
    heatEmpty: 'rgba(255,255,255,0.10)',
    heatLow: '#A7F3D0',
    heatMid: '#34D399',
    heatFull: '#059669',
    badgeBg: 'rgba(16,185,129,0.30)',
    badgeBorder: 'rgba(52,211,153,0.4)',
    badgeText: '#A7F3D0',
    tagColor: '#34D399',
    levelBg: 'rgba(16,185,129,0.50)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    bgTop: '#2C0A00',
    bgMid: '#7C2D12',
    bgBottom: '#1C0400',
    glowColor: '#F97316',
    accentFrom: '#FCD34D',
    accentTo: '#EF4444',
    heatEmpty: 'rgba(255,255,255,0.10)',
    heatLow: '#FED7AA',
    heatMid: '#FB923C',
    heatFull: '#EF4444',
    badgeBg: 'rgba(249,115,22,0.30)',
    badgeBorder: 'rgba(252,211,77,0.35)',
    badgeText: '#FED7AA',
    tagColor: '#FB923C',
    levelBg: 'rgba(249,115,22,0.45)',
  },
  {
    id: 'ocean',
    name: 'Océano',
    emoji: '🌊',
    bgTop: '#0C1445',
    bgMid: '#0E3A6E',
    bgBottom: '#060A26',
    glowColor: '#0EA5E9',
    accentFrom: '#7DD3FC',
    accentTo: '#0284C7',
    heatEmpty: 'rgba(255,255,255,0.10)',
    heatLow: '#BAE6FD',
    heatMid: '#38BDF8',
    heatFull: '#0284C7',
    badgeBg: 'rgba(14,165,233,0.30)',
    badgeBorder: 'rgba(125,211,252,0.4)',
    badgeText: '#BAE6FD',
    tagColor: '#38BDF8',
    levelBg: 'rgba(14,165,233,0.45)',
  },
  {
    id: 'rose',
    name: 'Rosa',
    emoji: '🌸',
    bgTop: '#2D001C',
    bgMid: '#600030',
    bgBottom: '#160010',
    glowColor: '#EC4899',
    accentFrom: '#F9A8D4',
    accentTo: '#DB2777',
    heatEmpty: 'rgba(255,255,255,0.10)',
    heatLow: '#FBCFE8',
    heatMid: '#F472B6',
    heatFull: '#DB2777',
    badgeBg: 'rgba(236,72,153,0.30)',
    badgeBorder: 'rgba(249,168,212,0.4)',
    badgeText: '#FBCFE8',
    tagColor: '#F472B6',
    levelBg: 'rgba(236,72,153,0.45)',
  },
]

// ── Score ring ────────────────────────────────────────────────────────
function ScoreRingSvg({ score, theme }: { score: number; theme: ShareCardTheme }) {
  const size = 90
  const strokeWidth = 8
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(Math.max(score / 100, 0), 1)
  const dash = circumference * progress
  const gradId = `scoreGrad_${theme.id}`

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.accentFrom} />
          <Stop offset="1" stopColor={theme.accentTo} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
      <SvgText
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="20"
        fontWeight="800"
      >
        {Math.round(score)}
      </SvgText>
      <SvgText
        x={size / 2}
        y={size / 2 + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.65)"
        fontSize="10"
        fontWeight="600"
      >
        SCORE
      </SvgText>
    </Svg>
  )
}

// ── Weekly heatmap dots ──────────────────────────────────────────────
function HeatmapRow({
  days,
  theme,
}: {
  days: { date: string; rate: number }[]
  theme: ShareCardTheme
}) {
  const DOT_SIZE = 32
  const DOT_GAP = 8
  const totalW = days.length * DOT_SIZE + (days.length - 1) * DOT_GAP

  const getColor = (rate: number) => {
    if (rate === 0) return theme.heatEmpty
    if (rate < 0.4) return theme.heatLow
    if (rate < 0.75) return theme.heatMid
    return theme.heatFull
  }

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <Svg width={totalW} height={DOT_SIZE + 20} viewBox={`0 0 ${totalW} ${DOT_SIZE + 20}`}>
      {days.map((d, i) => {
        const x = i * (DOT_SIZE + DOT_GAP)
        return (
          <G key={d.date}>
            <Rect x={x} y={0} width={DOT_SIZE} height={DOT_SIZE} rx={8} fill={getColor(d.rate)} />
            <SvgText
              x={x + DOT_SIZE / 2}
              y={DOT_SIZE + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.50)"
              fontSize="10"
              fontWeight="600"
            >
              {dayLabels[i]}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

// ── Themed background ────────────────────────────────────────────────
function CardBackground({ theme }: { theme: ShareCardTheme }) {
  const bgId = `bgGrad_${theme.id}`
  const glowId = `glowGrad_${theme.id}`
  return (
    <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <LinearGradient id={bgId} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor={theme.bgTop} />
          <Stop offset="0.5" stopColor={theme.bgMid} />
          <Stop offset="1" stopColor={theme.bgBottom} />
        </LinearGradient>
        <LinearGradient id={glowId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={theme.glowColor} stopOpacity="0.40" />
          <Stop offset="1" stopColor={theme.glowColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${bgId})`} rx={24} />
      <Circle cx={CARD_WIDTH * 0.82} cy={CARD_HEIGHT * 0.18} r={120} fill={`url(#${glowId})`} />
      <Circle cx={CARD_WIDTH * 0.15} cy={CARD_HEIGHT * 0.82} r={90} fill={`url(#${glowId})`} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Path
          key={i}
          d={`M 0 ${(CARD_HEIGHT / 6) * i} L ${CARD_WIDTH} ${(CARD_HEIGHT / 6) * i}`}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
        />
      ))}
    </Svg>
  )
}

// ── Public types ─────────────────────────────────────────────────────
export interface ShareCardData {
  displayName: string
  level: number
  levelName: string
  score: number
  streak: number
  totalHabits: number
  completedToday: number
  weekDays: { date: string; rate: number }[]  // 7 days Mon→Sun
}

interface ShareCardProps {
  data: ShareCardData
  theme?: ShareCardTheme
}

// ── Main component ───────────────────────────────────────────────────
export function ShareCard({ data, theme = SHARE_THEMES[0] }: ShareCardProps) {
  const completionPct = data.totalHabits > 0
    ? Math.round((data.completedToday / data.totalHabits) * 100)
    : 0

  return (
    <View style={styles.card}>
      <CardBackground theme={theme} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.appBrand}>
          <Text style={styles.appIcon}>🎯</Text>
          <Text style={styles.appName}>Habit Tracker</Text>
        </View>
        <View style={[styles.levelBadge, {
          backgroundColor: theme.badgeBg,
          borderColor: theme.badgeBorder,
        }]}>
          <Text style={[styles.levelText, { color: theme.badgeText }]}>Nv. {data.level}</Text>
        </View>
      </View>

      {/* User section */}
      <View style={styles.userSection}>
        <View style={[styles.avatarCircle, {
          backgroundColor: theme.levelBg,
          borderColor: theme.badgeBorder,
        }]}>
          <Text style={styles.avatarInitial}>
            {data.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{data.displayName}</Text>
          <Text style={styles.userTitle}>{data.levelName}</Text>
        </View>
      </View>

      {/* Score ring + stats */}
      <View style={styles.statsRow}>
        <ScoreRingSvg score={data.score} theme={theme} />
        <View style={styles.statsRight}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {data.streak}</Text>
            <Text style={styles.statLabel}>días de racha</Text>
          </View>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={styles.statValue}>{data.completedToday}/{data.totalHabits}</Text>
            <Text style={styles.statLabel}>hábitos hoy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionPct}%</Text>
            <Text style={styles.statLabel}>completado</Text>
          </View>
        </View>
      </View>

      {/* Weekly heatmap */}
      <View style={styles.heatmapSection}>
        <Text style={styles.sectionLabel}>ÚLTIMOS 7 DÍAS</Text>
        <HeatmapRow days={data.weekDays} theme={theme} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: theme.heatEmpty, label: 'Sin completar' },
          { color: theme.heatMid, label: 'Parcial' },
          { color: theme.heatFull, label: 'Completo' },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Construyendo hábitos un día a la vez 💪</Text>
        <Text style={[styles.footerTag, { color: theme.tagColor }]}>#HabitTracker</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 28,
    gap: 20,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIcon: { fontSize: 22 },
  appName: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  levelBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  userTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statsRight: {
    flex: 1,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItemBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
    fontWeight: '500',
  },
  heatmapSection: {
    gap: 10,
    alignItems: 'center',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    alignSelf: 'flex-start',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerTag: {
    fontSize: 13,
    fontWeight: '700',
  },
})
