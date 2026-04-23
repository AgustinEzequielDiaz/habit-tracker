import React, { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Share,
} from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { spacing, typography, radius } from '@/constants/theme'
import { ShareCard, ShareCardData, CARD_WIDTH, CARD_HEIGHT } from './ShareCard'

// Dynamic imports — graceful fallback if packages not yet installed
let ViewShot: any = null
let Sharing: any = null
try { ViewShot = require('react-native-view-shot').default } catch {}
try { Sharing = require('expo-sharing') } catch {}

interface SharePreviewModalProps {
  visible: boolean
  data: ShareCardData
  onClose: () => void
}

export function SharePreviewModal({ visible, data, onClose }: SharePreviewModalProps) {
  const { colors } = useTheme()
  const cardRef = useRef<any>(null)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    try {
      // Try image sharing via ViewShot + expo-sharing
      if (ViewShot && Sharing && cardRef.current) {
        const uri: string = await cardRef.current.capture()
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

      // Fallback — rich text via native Share sheet
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
      // user cancelled or error — do nothing
    } finally {
      setSharing(false)
    }
  }

  if (!visible) return null

  // Scale card to fit screen nicely
  const SCALE = 0.84

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: '#0F0720' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vista previa</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Card preview */}
        <ScrollView
          contentContainerStyle={styles.previewContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.cardWrapper, { transform: [{ scale: SCALE }] }]}>
            {ViewShot ? (
              <ViewShot
                ref={cardRef}
                options={{ format: 'png', quality: 1.0, width: CARD_WIDTH, height: CARD_HEIGHT }}
              >
                <ShareCard data={data} />
              </ViewShot>
            ) : (
              <ShareCard data={data} />
            )}
          </View>

          {/* Caption */}
          <Text style={styles.caption}>
            {ViewShot
              ? 'Tu tarjeta de progreso lista para compartir'
              : 'Compartí tu progreso como texto'}
          </Text>

          {!ViewShot && (
            <Text style={styles.installHint}>
              Instalá react-native-view-shot para compartir como imagen
            </Text>
          )}
        </ScrollView>

        {/* Footer actions */}
        <View style={[styles.footer, { borderTopColor: 'rgba(255,255,255,0.10)' }]}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing}
            style={[styles.shareBtn, { opacity: sharing ? 0.7 : 1 }]}
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
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  previewContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  caption: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  installHint: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    borderTopWidth: 1,
  },
  shareBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    // Shadow
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  shareBtnIcon: { fontSize: 18 },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
})
