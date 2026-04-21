import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert,
} from 'react-native'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user.store'
import { Card } from '@/components/ui/Card'
import { XPProgressBar } from '@/components/gamification/XPProgressBar'
import { AchievementCard } from '@/components/gamification/AchievementCard'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { ACHIEVEMENTS, LEVEL_NAMES } from '@/constants/achievements'
import { useHabitsStore } from '@/stores/habits.store'
import { UserAchievement } from '@/types'
import { StreakFreezeWidget } from '@/components/gamification/StreakFreezeWidget'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const { user, level, levelProgress, xpToNextLevel } = useUserStore()
  const { habits, loadHabits } = useHabitsStore()
  const [achievements, setAchievements] = useState<UserAchievement[]>([])

  useEffect(() => {
    loadAchievements()
    loadHabits()
  }, [user?.id])  // Re-ejecutar si cambia el usuario autenticado

  const loadAchievements = async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
    setAchievements((data ?? []) as UserAchievement[])
  }

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => supabase.auth.signOut(),
        },
      ]
    )
  }

  const unlockedKeys = new Set(achievements.map((a) => a.achievement_key))
  const achievementList = Object.values(ACHIEVEMENTS)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header de perfil */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.display_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={[styles.displayName, { color: colors.text }]}>
              {user?.display_name ?? 'Usuario'}
            </Text>
            <Text style={[styles.levelLabel, { color: colors.primary }]}>
              Nivel {level} · {LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}
            </Text>
          </View>
        </View>

        {/* XP */}
        <Card>
          <XPProgressBar
            level={level}
            levelProgress={levelProgress}
            xpToNextLevel={xpToNextLevel}
            totalXp={user?.total_xp ?? 0}
          />
        </Card>

        {/* Stats rápidas */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Score global', value: `${Math.round(user?.global_score ?? 0)}` },
            { label: 'Mejor racha', value: `${user?.streak_best ?? 0}d` },
            { label: 'Logros', value: `${unlockedKeys.size}/${achievementList.length}` },
            { label: 'Total XP', value: (user?.total_xp ?? 0).toLocaleString() },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard} padding={spacing.md}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Streak Freeze */}
        <StreakFreezeWidget />

        {/* Logros */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Logros ({unlockedKeys.size}/{achievementList.length})
          </Text>
          {achievementList.map((achievement) => (
            <AchievementCard
              key={achievement.key}
              achievement={achievement}
              unlocked={unlockedKeys.has(achievement.key)}
              unlockedAt={achievements.find((a) => a.achievement_key === achievement.key)?.unlocked_at}
            />
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: colors.error }]}
        >
          <Text style={[styles.signOutText, { color: colors.error }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
  },
  displayName: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  levelLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    gap: 3,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  signOutText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
})
