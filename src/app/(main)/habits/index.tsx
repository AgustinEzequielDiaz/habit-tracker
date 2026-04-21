import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, SectionList, SafeAreaView,
  TouchableOpacity, Modal, Alert,
} from 'react-native'
import { useHabitsStore } from '@/stores/habits.store'
import { HabitForm } from '@/components/habits/HabitForm'
import { HabitTemplatesModal } from '@/components/habits/HabitTemplatesModal'
import { Card } from '@/components/ui/Card'
import { StreakBadge } from '@/components/habits/StreakBadge'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { Habit, CreateHabitForm } from '@/types'
import { formatShortDate, todayString } from '@/utils/date'

// ─────────────────────────────────────────────────────
// Constantes de estilo
// ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  fitness:       '#EF4444',
  productividad: '#6366F1',
  bienestar:     '#10B981',
  rutinas:       '#F59E0B',
}

const CATEGORY_LABELS: Record<string, string> = {
  fitness:       'Fitness',
  productividad: 'Productividad',
  bienestar:     'Bienestar',
  rutinas:       'Rutinas',
}

// ─────────────────────────────────────────────────────
// Componente de item de hábito en la lista de gestión
// ─────────────────────────────────────────────────────

interface HabitListItemProps {
  item: Habit
  onArchive: (h: Habit) => void
  dimmed?: boolean
}

function HabitListItem({ item, onArchive, dimmed = false }: HabitListItemProps) {
  const { colors } = useTheme()

  // Días restantes para hábitos con end_date
  const daysRemaining = (() => {
    if (!item.end_date) return null
    const today = todayString()
    return Math.round(
      (new Date(item.end_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
  })()

  // Días hasta que empieza (para upcoming)
  const daysUntilStart = (() => {
    if (!item.start_date) return null
    const today = todayString()
    return Math.round(
      (new Date(item.start_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
  })()

  return (
    <Card style={styles.habitCard} padding={spacing.md}>
      <View style={styles.habitRow}>
        <View style={[styles.colorDot, { backgroundColor: dimmed ? `${item.color}60` : item.color }]} />
        <View style={styles.habitInfo}>
          <Text
            style={[
              styles.habitName,
              { color: dimmed ? colors.textSecondary : colors.text },
            ]}
          >
            {item.name}
          </Text>
          <View style={styles.habitMeta}>
            <View style={[styles.categoryPill, { backgroundColor: `${CATEGORY_COLORS[item.category]}20` }]}>
              <Text style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] }]}>
                {CATEGORY_LABELS[item.category]}
              </Text>
            </View>
            <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>
              {item.difficulty === 'easy' ? 'Fácil' : item.difficulty === 'normal' ? 'Normal' : 'Difícil'}
            </Text>

            {/* Racha activa */}
            {(item.current_streak ?? 0) >= 2 && (
              <StreakBadge streak={item.current_streak ?? 0} compact />
            )}

            {/* Fecha de inicio para upcoming */}
            {daysUntilStart !== null && daysUntilStart > 0 && (
              <View style={[styles.schedulePill, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.schedulePillText, { color: colors.primary }]}>
                  📅 {daysUntilStart === 1 ? 'Mañana' : formatShortDate(item.start_date!)}
                </Text>
              </View>
            )}

            {/* Días restantes para challenge */}
            {daysRemaining !== null && daysRemaining >= 0 && (
              <View style={[
                styles.schedulePill,
                {
                  backgroundColor: daysRemaining <= 3
                    ? `${colors.error}15`
                    : daysRemaining <= 7
                      ? `${colors.warning}15`
                      : `${colors.success}15`,
                },
              ]}>
                <Text style={[
                  styles.schedulePillText,
                  {
                    color: daysRemaining <= 3
                      ? colors.error
                      : daysRemaining <= 7
                        ? colors.warning
                        : colors.success,
                  },
                ]}>
                  🏁 {daysRemaining === 0 ? 'Último día' : `${daysRemaining}d restantes`}
                </Text>
              </View>
            )}

            {/* Challenge completado (expired) */}
            {daysRemaining !== null && daysRemaining < 0 && (
              <View style={[styles.schedulePill, { backgroundColor: `${colors.textSecondary}15` }]}>
                <Text style={[styles.schedulePillText, { color: colors.textSecondary }]}>
                  ✅ Challenge completado
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onArchive(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>···</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )
}

// ─────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────

export default function HabitsScreen() {
  const { colors } = useTheme()
  const { habits, upcomingHabits, expiredHabits, loadHabits, addHabit, archiveHabit } = useHabitsStore()
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [prefillForm, setPrefillForm] = useState<CreateHabitForm | undefined>()

  useEffect(() => { loadHabits() }, [])

  const handleCreate = async (form: CreateHabitForm) => {
    await addHabit(form)
    setShowForm(false)
    setPrefillForm(undefined)
  }

  const handleTemplateSelect = (form: CreateHabitForm) => {
    setShowTemplates(false)
    setPrefillForm(form)
    setShowForm(true)
  }

  const handleArchive = (habit: Habit) => {
    Alert.alert(
      'Archivar hábito',
      `¿Querés archivar "${habit.name}"? Podés recuperarlo después.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: () => archiveHabit(habit.id),
        },
      ]
    )
  }

  // Construir secciones dinámicas para SectionList
  type Section = { title: string; subtitle?: string; data: Habit[]; dimmed?: boolean }
  const sections: Section[] = []

  if (habits.length > 0) {
    sections.push({ title: 'Activos', data: habits })
  }
  if (upcomingHabits.length > 0) {
    sections.push({
      title: 'Próximos',
      subtitle: 'Empiezan en los próximos días',
      data: upcomingHabits,
      dimmed: true,
    })
  }
  if (expiredHabits.length > 0) {
    sections.push({
      title: 'Challenges completados',
      subtitle: 'Podés archivarlos si ya no los necesitás',
      data: expiredHabits,
      dimmed: true,
    })
  }

  const isEmpty = habits.length === 0 && upcomingHabits.length === 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mis hábitos</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => setShowTemplates(true)}
            style={[styles.templatesBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.templatesBtnText, { color: colors.text }]}>✨ Plantillas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setPrefillForm(undefined); setShowForm(true) }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isEmpty ? (
        // Empty state
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No tenés hábitos todavía
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Usá plantillas para empezar rápido o creá uno desde cero
          </Text>
          <TouchableOpacity
            onPress={() => setShowTemplates(true)}
            style={[styles.emptyTemplatesBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.emptyTemplatesBtnText}>✨ Ver plantillas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => (
            <HabitListItem
              item={item}
              onArchive={handleArchive}
              dimmed={(section as Section).dimmed}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {(section as Section).title}
              </Text>
              {(section as Section).subtitle && (
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {(section as Section).subtitle}
                </Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Modal de creación */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowForm(false); setPrefillForm(undefined) }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {prefillForm ? 'Confirmar hábito' : 'Nuevo hábito'}
            </Text>
          </View>
          <HabitForm
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setPrefillForm(undefined) }}
            initial={prefillForm}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de plantillas */}
      <HabitTemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  templatesBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  templatesBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addBtnText: {
    color: '#fff',
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  habitCard: {
    marginBottom: spacing.sm,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  difficultyText: {
    fontSize: typography.sizes.xs,
  },
  schedulePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  schedulePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTemplatesBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  emptyTemplatesBtnText: {
    color: '#fff',
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
})
