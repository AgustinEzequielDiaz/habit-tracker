import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { radius, shadows, spacing } from '@/constants/theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: number
  shadow?: boolean
}

export function Card({ children, style, padding = spacing.md, shadow = true }: CardProps) {
  const { colors, isDark } = useTheme()

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
        },
        shadow && !isDark && shadows.md,
        shadow && isDark && { borderWidth: 1 },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
})
