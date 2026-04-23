import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions, ScrollView, Platform, TextInput, Keyboard,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { useJournalStore } from '@/stores/journal.store'
import { todayString, formatDisplayDate } from '@/utils/date'

const { height: SCREEN_H } = Dimensions.get('window')
const SHEET_H = SCREEN_H * 0.82
const MAX_CHARS = 500

// Prompts rotativos — uno por día de la semana
const DAILY_PROMPTS = [
  '¿Qué fue lo más importante que lograste hoy?',          // domingo
  '¿Qué aprendiste sobre tus hábitos hoy?',                // lunes
  '¿Qué te resultó difícil? ¿Por qué fue así?',            // martes
  '¿Cómo te sentiste completando tus hábitos hoy?',        // miércoles
  '¿Qué repetirías mañana sin dudarlo?',                   // jueves
  '¿Qué mejorarías si pudieras empezar el día de nuevo?',  // viernes
  '¿Cómo estuvo tu energía y estado de ánimo hoy?',        // sábado
]

function getDailyPrompt(): string {
  return DAILY_PROMPTS[new Date().getDay()]
}

interface JournalSheetProps {
  visible: boolean
  onClose: () => void
}

export function JournalSheet({ visible, onClose }: JournalSheetProps) {
  const { colors } = useTheme()
  const {
    todayEntry, setTodayEntry, saveTodayEntry,
    loadHistory, isHydrated, history,
  } = useJournalStore()
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!isHydrated) loadHistory()
  }, [])

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => inputRef.current?.focus(), 120)
      })
    }
  }, [visible])

  const handleClose = async () => {
    Keyboard.dismiss()
    await saveTodayEntry()
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_H,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose())
  }

  if (!visible) return null

  const today = todayString()
  const prompt = getDailyPrompt()
  const charCount = todayEntry.length
  const hasContent = todayEntry.trim().length > 0

  // Historial reciente (hasta 3 entradas, sin contar hoy)
  const recentHistory = history
    .filter((e) => e.date !== today && e.text.trim())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleWrapper}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.divider }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              📓 Nota del día
            </Text>
            <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
              {formatDisplayDate(today)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Prompt del día */}
          <View
            style={[
              styles.promptBox,
              {
                backgroundColor: `${colors.primary}0D`,
                borderColor: `${colors.primary}22`,
              },
            ]}
          >
            <Text style={[styles.promptLabel, { color: colors.primary }]}>
              ✨ Reflexión de hoy
            </Text>
            <Text style={[styles.promptText, { color: colors.text }]}>
              {prompt}
            </Text>
          </View>

          {/* Textarea */}
          <View
            style={[
              styles.textareaWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: focused ? colors.primary : colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={todayEntry}
              onChangeText={(t) => setTodayEntry(t.slice(0, MAX_CHARS))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={prompt}
              placeholderTextColor={colors.textDisabled}
              multiline
              style={[styles.textarea, { color: colors.text }]}
              textAlignVertical="top"
              scrollEnabled={false}
            />
            {/* Footer del textarea */}
            <View
              style={[styles.textareaFooter, { borderTopColor: `${colors.border}80` }]}
            >
              <Text
                style={[
                  styles.charCount,
                  {
                    color:
                      charCount > MAX_CHARS * 0.85 ? colors.warning : colors.textDisabled,
                  },
                ]}
              >
                {charCount}/{MAX_CHARS}
              </Text>
              {hasContent && (
                <View style={[styles.savedBadge, { backgroundColor: `${colors.success}15` }]}>
                  <Text style={[styles.savedText, { color: colors.success }]}>
                    ✓ Auto-guardado
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Historial reciente */}
          {recentHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>
                DÍAS ANTERIORES
              </Text>
              {recentHistory.map((entry) => (
                <View
                  key={entry.date}
                  style={[
                    styles.historyEntry,
                    {
                      backgroundColor: colors.surface,
                      borderLeftColor: `${colors.primary}45`,
                    },
                  ]}
                >
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {formatDisplayDate(entry.date)}
                  </Text>
                  <Text
                    style={[styles.historyText, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {entry.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(28,25,23,0.60)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  handleWrapper: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 16,
    gap: spacing.lg,
  },
  promptBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  promptLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  promptText: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
    lineHeight: 22,
  },
  textareaWrapper: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  textarea: {
    padding: spacing.md,
    fontSize: typography.sizes.md,
    lineHeight: 23,
    minHeight: 150,
  },
  textareaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  charCount: {
    fontSize: typography.sizes.xs,
  },
  savedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  savedText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  historySection: { gap: spacing.sm },
  historyTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  historyEntry: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },
  historyDate: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  historyText: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    fontStyle: 'italic',
  },
})
