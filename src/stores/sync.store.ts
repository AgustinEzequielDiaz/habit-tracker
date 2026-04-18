import { create } from 'zustand'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from '@/services/supabase'
import { getPendingOperations, markSynced } from '@/utils/offline-queue'

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncAt: string | null

  // Actions
  initNetworkListener: () => () => void  // retorna cleanup fn
  syncPendingOperations: () => Promise<void>
  checkPending: () => Promise<void>
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,

  initNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !get().isOnline
      const isNowOnline = !!state.isConnected

      set({ isOnline: isNowOnline })

      // Al recuperar conexión, sincronizar automáticamente
      if (wasOffline && isNowOnline) {
        get().syncPendingOperations()
      }
    })

    // Check inicial
    NetInfo.fetch().then((state) => {
      set({ isOnline: !!state.isConnected })
    })

    return unsubscribe
  },

  syncPendingOperations: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    const pending = await getPendingOperations()
    if (pending.length === 0) return

    set({ isSyncing: true })

    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        set({ isSyncing: false })
        return
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-offline-queue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ operations: pending }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        const syncedIds = result.results
          .filter((r: { success: boolean; id: string }) => r.success)
          .map((r: { id: string }) => r.id)

        await markSynced(syncedIds)
        set({
          pendingCount: pending.length - syncedIds.length,
          lastSyncAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.warn('Sync error:', error)
    } finally {
      set({ isSyncing: false })
    }
  },

  checkPending: async () => {
    const pending = await getPendingOperations()
    set({ pendingCount: pending.length })
  },
}))
