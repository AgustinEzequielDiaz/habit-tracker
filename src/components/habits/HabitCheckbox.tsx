import React, { useEffect } from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { radius } from '@/constants/theme'

interface HabitCheckboxProps {
  checked: boolean
  color: string
  onPress: () => void
  size?: number
  disabled?: boolean
}

export function HabitCheckbox({
  checked,
  color,
  onPress,
  size = 28,
  disabled = false,
}: HabitCheckboxProps) {
  const progress = useSharedValue(checked ? 1 : 0)
  const scale = useSharedValue(1)

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    })
  }, [checked])

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', color]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [color, color]
    ),
    transform: [{ scale: scale.value }],
  }))

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }))

  const handlePress = async () => {
    if (disabled) return

    // Animación de rebote
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    )

    // Haptic feedback
    await Haptics.impactAsync(
      checked
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    )

    onPress()
  }

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size * 0.3, borderColor: color },
          containerStyle,
        ]}
      >
        <Animated.Text style={[styles.check, checkStyle]}>✓</Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
})
