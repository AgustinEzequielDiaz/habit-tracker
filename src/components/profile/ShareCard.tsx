import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, {
  Circle, Rect, Defs, LinearGradient, Stop, Path, G, Text as SvgText,
} from 'react-native-svg'

// Fixed dimensions for the share card (portrait, Instagram-friendly)
export const CARD_WIDTH = 360
export const CARD_HEIGHT = 540

// ── Micro score ring ─────────────────────────────────────────────────
function ScoreRingSvg({ score }: { score: number }) {
  const size = 90
  const strokeWidth = 8
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(Math.max(score / 100, 0), 1)
  const dash = circumference * progress

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#7C3AED" />
        </LinearGradient>
      </Defs>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#scoreGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
      {/* Score label */}
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
function HeatmapRow({ days }: { days: { date: string; rate: number }[] }) {
  const DOT_SIZE = 32
  const DOT_GAP = 8
  const totalW = days.length * DOT_SIZE + (days.length - 1) * DOT_GAP

  const getColor = (rate: number) => {
    if (rate === 0) return 'rgba(255,255,255,0.12)'
    if (rate < 0.4) return '#DDD6FE'
    if (rate < 0.75) return '#A78BFA'
    return '#7C3AED'
  }

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <Svg width={totalW} height={DOT_SIZE + 20} viewBox={`0 0 ${totalW} ${DOT_SIZE + 20}`}>
      {days.map((d, i) => {
        const x = i * (DOT_SIZE + DOT_GAP)
        const color = getColor(d.rate)
        return (
          <G key={d.date}>
            <Rect
              x={x}
              y={0}
              width={DOT_SIZE}
              height={DOT_SIZE}
              rx={8}
              fill={color}
            />
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

// ── Background gradient card ─────────────────────────────────────────
function CardBackground() {
  return (
    <Svg
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#1A0533" />
          <Stop offset="0.5" stopColor="#2D1054" />
          <Stop offset="1" stopColor="#0F0720" />
        </LinearGradient>
        <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Base gradient */}
      <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#bgGrad)" rx={24} />
      {/* Glow orb top-right */}
      <Circle cx={CARD_WIDTH * 0.82} cy={CARD_HEIGHT * 0.18} r={120} fill="url(#glowGrad)" />
      {/* Glow orb bottom-left */}
      <Circle cx={CARD_WIDTH * 0.15} cy={CARD_HEIGHT * 0.82} r={90} fill="url(#glowGrad)" />
      {/* Subtle grid lines */}
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

// ── Main component ───────────────────────────────────────────────────
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
}

export function ShareCard({ data }: ShareCardProps) {
  const completionPct = data.totalHabits > 0
    ? Math.round((data.completedToday / data.totalHabits) * 100)
    : 0

  return (
    <View style={styles.card}>
      <CardBackground />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.appBrand}>
          <Text style={styles.appIcon}>🎯</Text>
          <Text style={styles.appName}>Habit Tracker</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Nv. {data.level}</Text>
        </View>
      </View>

      {/* ── User section ── */}
      <View style={styles.userSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {data.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{data.displayName}</Text>
          <Text style={styles.userTitle}>{data.levelName}</Text>
        </View>
      </View>

      {/* ── Score ring + stats ── */}
      <View style={styles.statsRow}>
        <ScoreRingSvg score={data.score} />
        <View style={styles.statsRight}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {data.streak}</Text>
            <Text style={styles.statLabel}>días de racha</Text>
          </View>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={styles.statValue}>
              {data.completedToday}/{data.totalHabits}
            </Text>
            <Text style={styles.statLabel}>hábitos hoy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionPct}%</Text>
            <Text style={styles.statLabel}>completado</Text>
          </View>
        </View>
      </View>

      {/* ── Weekly heatmap ── */}
      <View style={styles.heatmapSection}>
        <Text style={styles.sectionLabel}>ÚLTIMOS 7 DÍAS</Text>
        <HeatmapRow days={data.weekDays} />
      </View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {[
          { color: 'rgba(255,255,255,0.12)', label: 'Sin completar' },
          { color: '#DDD6FE', label: 'Parcial' },
          { color: '#7C3AED', label: 'Completo' },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendLabel}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Construyendo hábitos un día a la vez 💪
        </Text>
        <Text style={styles.footerTag}>#HabitTracker</Text>
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
    backgroundColor: 'rgba(124,58,237,0.40)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  levelText: {
    color: '#DDD6FE',
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
    backgroundColor: 'rgba(124,58,237,0.50)',
    borderWidth: 2,
    borderColor: 'rgba(167,139,250,0.5)',
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
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
  },
})
