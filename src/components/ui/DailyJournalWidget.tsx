import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Animated, Keyboard,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { useJournalStore } from '@/stores/journal.store'

const MAX_CHARS = 300

export function DailyJournalWidget() {
  const { colors } = useTheme()
  const { todayEntry, setTodayEntry, saveTodayEntry, loadHistory, isHydrated } = useJournalStore()
  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)
  const heightAnim = useRef(new Animated.Value(0)).current
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!isHydrated) loadHistory()
  }, [])

  // Si ya hay contenido hoy, empezar expandido
  useEffect(() => {
    if (isHydrated && todayEntry.length > 0) {
      setExpanded(true)
      Animated.timing(heightAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start()
    }
  }, [isHydrated])

  const toggle = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    Animated.timing(heightAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (newExpanded) inputRef.current?.focus()
    })
    if (!newExpanded && focused) {
      Keyboard.dismiss()
      saveTodayEntry()
    }
  }

  const handleBlur = () => {
    setFocused(false)
    saveTodayEntry()
  }

  const inputHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 90] })
  const charCount = todayEntry.length
  const hasContent = todayEntry.trim().length > 0

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: expanded ? colors.primary : colors.border, borderWidth: expanded ? 1.5 : 1 }]}>
      {/* Toggle header */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.header}>
        <Text style={styles.journalIcon}>📓</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Nota del día</Text>
          {!expanded && hasContent && (
            <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
              {todayEntry}
            </Text>
          )}
          {!expanded && !hasContent && (
            <Text style={[styles.placeholder, { color: colors.textDisabled }]}>
              ¿Qué fue lo más importante hoy?
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Text area animada */}
      <Animated.View style={[styles.inputWrapper, { maxHeight: inputHeight }]}>
        <TextInput
          ref={inputRef}
          value={todayEntry}
          onChangeText={(t) => setTodayEntry(t.slice(0, MAX_CHARS))}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder="¿Qué fue lo más importante hoy? ¿Cómo te sentiste? ¿Qué querés recordar?"
          placeholderTextColor={colors.textDisabled}
          multiline
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: focused ? colors.primary : colors.border,
            },
          ]}
          textAlignVertical="top"
        />
        <View style={styles.footer}>
          <Text style={[styles.charCount, {
            color: charCount > MAX_CHARS * 0.85 ? colors.warning : colors.textDisabled,
          }]}>
            {charCount}/{MAX_CHARS}
          </Text>
          {hasContent && (
            <TouchableOpacity
              onPress={() => { saveTodayEntry(); Keyboard.dismiss() }}
              style={[styles.saveBtn, { backgroundColor: `${colors.primary}14` }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primary }]}>Guardar ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  journalIcon: { fontSize: 20 },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  preview: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  placeholder: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrapper: {
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    minHeight: 72,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: typography.sizes.xs,
  },
  saveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  saveBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
})
