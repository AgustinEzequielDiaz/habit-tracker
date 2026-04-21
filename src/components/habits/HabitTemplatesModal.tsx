import React, { useState } from 'react'
import {
  View, Text, StyleSheet, Modal, SafeAreaView,
  ScrollView, TouchableOpacity, FlatList,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { CreateHabitForm } from '@/types'
import { TEMPLATE_CATEGORIES, HabitTemplate } from '@/constants/habit-templates'
import { HABIT_COLORS } from '@/constants/theme'

interface HabitTemplatesModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (form: CreateHabitForm) => void
}

export function HabitTemplatesModal({ visible, onClose, onSelect }: HabitTemplatesModalProps) {
  const { colors } = useTheme()
  const [activeCategoryId, setActiveCategoryId] = useState(TEMPLATE_CATEGORIES[0].id)

  const activeCategory = TEMPLATE_CATEGORIES.find((c) => c.id === activeCategoryId)!

  const handleSelect = (template: HabitTemplate) => {
    // Asignar un color según la categoría
    const catIndex = TEMPLATE_CATEGORIES.findIndex((c) => c.id === activeCategoryId)
    const color = HABIT_COLORS[catIndex * 2 % HABIT_COLORS.length]
    onSelect({ ...template.form, color })
  }

  const difficultyConfig: Record<string, { label: string; color: string }> = {
    easy:   { label: 'Fácil',   color: colors.success },
    normal: { label: 'Normal',  color: colors.primary },
    hard:   { label: 'Difícil', color: colors.error },
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Plantillas</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Elegí un hábito pre-configurado
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs de categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategoryId
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategoryId(cat.id)}
                style={[
                  styles.tab,
                  isActive
                    ? { backgroundColor: cat.color }
                    : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Text style={styles.tabEmoji}>{cat.emoji}</Text>
                <Text style={[styles.tabLabel, { color: isActive ? '#fff' : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Lista de plantillas */}
        <FlatList
          data={activeCategory.templates}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const diff = difficultyConfig[item.form.difficulty]
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <View style={[styles.templateIcon, { backgroundColor: `${activeCategory.color}18` }]}>
                  <Text style={styles.templateEmoji}>{item.description.split(' ')[0].length <= 2 ? '✨' : activeCategory.emoji}</Text>
                </View>
                <View style={styles.templateBody}>
                  <Text style={[styles.templateName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.templateDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={[styles.diffPill, { backgroundColor: `${diff.color}18` }]}>
                    <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
                  </View>
                </View>
                <View style={[styles.addBtn, { backgroundColor: activeCategory.color }]}>
                  <Text style={styles.addBtnText}>+</Text>
                </View>
              </TouchableOpacity>
            )
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Podés personalizar cualquier hábito después de crearlo
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  tabsScroll: {
    flexGrow: 0,
    paddingVertical: spacing.md,
  },
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  tabEmoji: { fontSize: 15 },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateEmoji: { fontSize: 22 },
  templateBody: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  templateDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  diffPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 2,
  },
  diffText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
})
