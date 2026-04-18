import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, radius, typography } from '@/constants/theme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  onPress: () => void
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme()

  const bgColors: Record<ButtonVariant, string> = {
    primary:   colors.primary,
    secondary: colors.primaryLight,
    ghost:     'transparent',
    danger:    colors.error,
  }

  const textColors: Record<ButtonVariant, string> = {
    primary:   colors.textInverse,
    secondary: colors.primary,
    ghost:     colors.primary,
    danger:    '#FFFFFF',
  }

  const paddings: Record<ButtonSize, { px: number; py: number }> = {
    sm: { px: spacing.md, py: spacing.sm },
    md: { px: spacing.lg, py: spacing.md - 2 },
    lg: { px: spacing.xl, py: spacing.md },
  }

  const fontSizes: Record<ButtonSize, number> = {
    sm: typography.sizes.sm,
    md: typography.sizes.md,
    lg: typography.sizes.lg,
  }

  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: bgColors[variant],
          paddingHorizontal: paddings[size].px,
          paddingVertical: paddings[size].py,
          borderRadius: radius.lg,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: variant === 'ghost' ? colors.primary : 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColors[variant]}
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: textColors[variant],
              fontSize: fontSizes[size],
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 80,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
