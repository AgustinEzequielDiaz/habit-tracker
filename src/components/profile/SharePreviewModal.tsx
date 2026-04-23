import React, { useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Share,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native'
import { spacing, typography, radius } from '@/constants/theme'
import {
  ShareCard, ShareCardData, ShareCardTheme,
  SHARE_THEMES, CARD_WIDTH, CARD_HEIGHT,
} from './ShareCard'

// Dynamic imports — graceful fallback if packages not yet installed
let ViewShot: any = null
let Sharing: any = null
try { ViewShot = require('react-native-view-shot').default } catch {}
try { Sharing = require('expo-sharing') } catch {}

const SCREEN_WIDTH = Dimensions.get('window').width

// Each carousel page is the full screen width; card is centered inside
const CARD_SCALE = 0.84
const PAGE_WIDTH = SCREEN_WIDTH

interface SharePreviewModalProps {
  visible: boolean
  data: ShareCardData
  onClose: () => void
}

export function SharePreviewModal({ visible, data, onClose }: SharePreviewModalProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sharing, setSharing] = useState(false)

  // One ViewShot ref per theme
  const cardRefs = useRef<any[]>(SHARE_THEMES.map(() => null))
  const carouselRef = useRef<ScrollView>(null)

  const activeTheme: ShareCardTheme = SHARE_THEMES[activeIndex]

  // Track which page is visible
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x
      const index = Math.round(offsetX / PAGE_WIDTH)
      if (index !== activeIndex) setActiveIndex(index)
    },
    [activeIndex]
  )

  // Snap to a specific theme
  const goToTheme = useCallback((index: number) => {
    carouselRef.current?.scrollTo({ x: index * PAGE_WIDTH, animated: true })
    setActiveIndex(index)
  }, [])

  const handleShare = async () => {
    setSharing(true)
    try {
      // Try image sharing via ViewShot + expo-sharing
      const ref = cardRefs.current[activeIndex]
      if (ViewShot && Sharing && ref) {
        const uri: string = await ref.capture()
        const canShare = await Sharing.isAvailableAsync()
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartir progreso',
          })
          onClose()
          return
        }
      }

      // Fallback — rich text share
      const pct = data.totalHabits > 0
        ? Math.round((data.completedToday / data.totalHabits) * 100)
        : 0
      const weekEmojis = data.weekDays.map((d) => {
        if (d.rate === 0) return '⬜'
        if (d.rate >= 1) return '✅'
        return '🟨'
      }).join(' ')

      await Share.share({
        message: [
          `📊 Mi progreso en Habit Tracker`,
          ``,
          `🏅 Nivel ${data.level} · Score ${Math.round(data.score)}/100`,
          `🔥 Racha actual: ${data.streak} días`,
          `✅ Hoy: ${data.completedToday}/${data.totalHabits} hábitos (${pct}%)`,
          ``,
          `📅 Últimos 7 días:`,
          weekEmojis,
          ``,
          `Construyendo hábitos un día a la vez 💪`,
          `#HabitTracker`,
        ].join('\n'),
      })
      onClose()
    } catch {
      // user cancelled — do nothing
    } finally {
      setSharing(false)
    }
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elegí tu diseño</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Carousel ── */}
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {SHARE_THEMES.map((theme, index) => (
            <View key={theme.id} style={styles.carouselPage}>
              <View
                style={[
                  styles.cardWrapper,
                  { shadowColor: theme.glowColor },
                ]}
              >
                {ViewShot ? (
                  <ViewShot
                    ref={(r: any) => { cardRefs.current[index] = r }}
                    options={{ format: 'png', quality: 1.0, width: CARD_WIDTH, height: CARD_HEIGHT }}
                  >
                    <ShareCard data={data} theme={theme} />
                  </ViewShot>
                ) : (
                  <ShareCard data={data} theme={theme} />
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Theme name + dots ── */}
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>
            {activeTheme.emoji}  {activeTheme.name}
          </Text>
          <View style={styles.dotsRow}>
            {SHARE_THEMES.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => goToTheme(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[
                  styles.dot,
                  i === activeIndex
                    ? [styles.dotActive, { backgroundColor: activeTheme.accentFrom }]
                    : styles.dotInactive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Swipe hint ── */}
        <Text style={styles.swipeHint}>
          Deslizá para cambiar diseño
        </Text>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={[
              styles.shareBtn,
              {
                backgroundColor: activeTheme.accentTo,
                shadowColor: activeTheme.accentTo,
                opacity: sharing ? 0.7 : 1,
              },
            ]}
          >
            {sharing
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text style={styles.shareBtnIcon}>🔗</Text>
                  <Text style={styles.shareBtnText}>
                    {ViewShot ? 'Compartir imagen' : 'Compartir texto'}
                  </Text>
                </>
              )
            }
          </TouchableOpacity>

          {!ViewShot && (
            <Text style={styles.installHint}>
              Instalá react-native-view-shot para compartir como imagen
            </Text>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // ── Carousel ──
  carousel: {
    flex: 1,
  },
  carouselContent: {
    // no extra padding — each page occupies PAGE_WIDTH
  },
  carouselPage: {
    width: PAGE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    transform: [{ scale: CARD_SCALE }],
    // Shadow
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 18,
  },

  // ── Theme info ──
  themeInfo: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: spacing.sm,
  },
  themeName: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    height: 7,
  },
  dotInactive: {
    width: 7,
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    fontStyle: 'italic',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  shareBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.50,
    shadowRadius: 14,
    elevation: 8,
  },
  shareBtnIcon: { fontSize: 18 },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  installHint: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
