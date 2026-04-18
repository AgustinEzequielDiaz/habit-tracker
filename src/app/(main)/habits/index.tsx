import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, Modal, Alert,
} from 'react-native'
import { useHabitsStore } from '@/stores/habits.store'
import { HabitForm } from '@/components/habits/HabitForm'
import { Card } from '@/components/ui/Card'
import { StreakBadge } from '@/components/habits/StreakBadge'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { Habit, CreateHabitForm } from '@/types'

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

export default function HabitsScreen() {
  const { colors } = useTheme()
  const { habits, loadHabits, addHabit, archiveHabit, isLoading } = useHabitsStore()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadHabits() }, [])

  const handleCreate = async (form: CreateHabitForm) => {
    await addHabit(form)
    setShowForm(false)
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

  const renderHabit = ({ item }: { item: Habit }) => (
    <Card style={styles.habitCard} padding={spacing.md}>
      <View style={styles.habitRow}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.habitMeta}>
            <View style={[styles.categoryPill, { backgroundColor: `${CATEGORY_COLORS[item.category]}20` }]}>
              <Text style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] }]}>
                {CATEGORY_LABELS[item.category]}
              </Text>
            </View>
            <Text style={[styles.difficultyText, { color: colors.textSecondary }]}>
              {item.difficulty === 'easy' ? 'Fácil' : item.difficulty === 'normal' ? 'Normal' : 'Difícil'}
            </Text>
            {(item.current_streak ?? 0) >= 2 && (
              <StreakBadge streak={item.current_streak ?? 0} compact />
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleArchive(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>···</Text>
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mis hábitos</Text>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No tenés hábitos todavía
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Creá tu primer hábito para empezar tu racha
            </Text>
          </View>
        )}
      />

      {/* Modal de creación */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo hábito</Text>
          </View>
          <HabitForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </SafeAreaView>
      </Modal>
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
    gap: spacing.sm,
  },
  habitCard: {
    marginBottom: 0,
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
  emptyState: {
    alignItems: 'center',
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
