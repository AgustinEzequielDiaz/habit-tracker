import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/stores/user.store'
import { useHabitsStore } from '@/stores/habits.store'
import { useCompletionsStore } from '@/stores/completions.store'
import { useSettingsStore } from '@/stores/settings.store'
import { getLast7Days } from '@/utils/date'
import { Card } from '@/components/ui/Card'
import { XPProgressBar } from '@/components/gamification/XPProgressBar'
import { AchievementCard } from '@/components/gamification/AchievementCard'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { ACHIEVEMENTS, LEVEL_NAMES } from '@/constants/achievements'
import { UserAchievement } from '@/types'
import { StreakFreezeWidget } from '@/components/gamification/StreakFreezeWidget'
import { SharePreviewModal } from '@/components/profile/SharePreviewModal'
import { ShareCardData } from '@/components/profile/ShareCard'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const { user, level, levelProgress, xpToNextLevel, setUser } = useUserStore()
  const { habits, loadHabits } = useHabitsStore()
  const { recentCompletions } = useCompletionsStore()
  const { avatarEmoji } = useSettingsStore()
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [signingOut, setSigningOut] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // El avatar puede ser: emoji de settings store, avatar_url de DB, o inicial del nombre
  const displayAvatar = avatarEmoji ?? user?.avatar_url ?? null
  const isEmojiAvatar = displayAvatar && displayAvatar.length <= 4 // los emojis son 1-4 chars

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
          onPress: async () => {
            setSigningOut(true)
            try {
              await supabase.auth.signOut()
            } finally {
              // Limpiar todos los stores antes de redirigir
              useHabitsStore.setState({ habits: [], upcomingHabits: [], expiredHabits: [] })
              useCompletionsStore.setState({ todayCompletions: [], recentCompletions: [] })
              // setUser(null) dispara el redirect vía (main)/_layout.tsx
              setUser(null)
              setSigningOut(false)
            }
          },
        },
      ]
    )
  }

  // Build share card data
  const shareCardData = useMemo((): ShareCardData => {
    const last7 = getLast7Days()
    const completionsByDay = new Map<string, number>()
    for (const c of recentCompletions) {
      if (last7.includes(c.completed_date)) {
        completionsByDay.set(c.completed_date, (completionsByDay.get(c.completed_date) ?? 0) + 1)
      }
    }
    const todayStr = last7[last7.length - 1]
    const completedToday = completionsByDay.get(todayStr) ?? 0
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.current_streak ?? 0), 0)
    const levelNum = user?.level ?? 1

    return {
      displayName: user?.display_name ?? 'Usuario',
      level: levelNum,
      levelName: LEVEL_NAMES[Math.min(levelNum - 1, LEVEL_NAMES.length - 1)],
      score: user?.global_score ?? 0,
      streak: maxStreak,
      totalHabits: habits.length,
      completedToday,
      weekDays: last7.map((date) => ({
        date,
        rate: habits.length > 0 ? (completionsByDay.get(date) ?? 0) / habits.length : 0,
      })),
    }
  }, [recentCompletions, habits, user])

  const unlockedKeys = new Set(achievements.map((a) => a.achievement_key))
  const achievementList = Object.values(ACHIEVEMENTS)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header de perfil */}
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileHeader}>
            {/* Avatar — emoji o inicial */}
            <TouchableOpacity
              onPress={() => router.push('/(main)/settings')}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: isEmojiAvatar ? `${colors.primary}18` : colors.primary }]}>
                {isEmojiAvatar
                  ? <Text style={styles.avatarEmoji}>{displayAvatar}</Text>
                  : <Text style={styles.avatarText}>{user?.display_name?.charAt(0).toUpperCase() ?? '?'}</Text>
                }
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {user?.display_name ?? 'Usuario'}
              </Text>
              <Text style={[styles.levelLabel, { color: colors.primary }]}>
                Nivel {level} · {LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}
              </Text>
            </View>
          </View>
          {/* Botones de acción */}
          <View style={styles.headerBtns}>
            {/* Compartir */}
            <TouchableOpacity
              onPress={() => setShareModalOpen(true)}
              style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18 }}>🔗</Text>
            </TouchableOpacity>
            {/* Configuración */}
            <TouchableOpacity
              onPress={() => router.push('/(main)/settings')}
              style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
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
          disabled={signingOut}
          style={[styles.signOutBtn, { borderColor: colors.error, opacity: signingOut ? 0.6 : 1 }]}
        >
          {signingOut
            ? <ActivityIndicator size="small" color={colors.error} />
            : <Text style={[styles.signOutText, { color: colors.error }]}>Cerrar sesión</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Share preview modal */}
      <SharePreviewModal
        visible={shareModalOpen}
        data={shareCardData}
        onClose={() => setShareModalOpen(false)}
      />
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
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: typography.sizes.xxl,
    fontWeight: '800',
  },
  avatarEmoji: {
    fontSize: 32,
    lineHeight: 38,
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
