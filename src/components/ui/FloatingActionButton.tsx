import React, { useEffect, useRef } from 'react'
import { Animated, TouchableOpacity, StyleSheet, Text } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore, FabAction } from '@/stores/settings.store'

const FAB_ICONS: Record<FabAction, string> = {
  quick_complete: '⚡',
  new_habit:      '➕',
  log_mood:       '😊',
  write_note:     '📓',
}

interface FloatingActionButtonProps {
  onPress: () => void
  /** Offset from the bottom edge — defaults to 88 (above the tab bar) */
  bottomOffset?: number
}

export function FloatingActionButton({ onPress, bottomOffset = 88 }: FloatingActionButtonProps) {
  const { colors } = useTheme()
  const { fabAction } = useSettingsStore()
  const scaleAnim = useRef(new Animated.Value(0)).current

  // Spring entrance on mount
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 180,
      delay: 300,
    }).start()
  }, [])

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // Quick pulse animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
    ]).start()
    onPress()
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottomOffset, transform: [{ scale: scaleAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.icon}>{FAB_ICONS[fabAction]}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    // Shadow
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    lineHeight: 28,
  },
})
