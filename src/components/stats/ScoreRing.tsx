import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '@/hooks/useTheme'
import { typography } from '@/constants/theme'
import { getScoreLevel } from '@/utils/scoring'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface ScoreRingProps {
  score: number         // 0-100
  size?: number
  strokeWidth?: number
  label?: string
  showScore?: boolean
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  label = 'Score global',
  showScore = true,
}: ScoreRingProps) {
  const { colors } = useTheme()
  const progress = useSharedValue(0)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const scoreLevel = getScoreLevel(score)
  const scoreColor = colors.scoreRing[scoreLevel]

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    })
  }, [score])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track (fondo) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.scoreRing.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progreso animado */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {showScore && (
        <View style={styles.textContainer}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {Math.round(score)}
          </Text>
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  labelText: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
})
