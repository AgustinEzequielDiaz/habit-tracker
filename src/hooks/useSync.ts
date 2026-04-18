import { useEffect } from 'react'
import { useSyncStore } from '@/stores/sync.store'

export function useSync() {
  const { isOnline, isSyncing, pendingCount, initNetworkListener, syncPendingOperations, checkPending } =
    useSyncStore()

  useEffect(() => {
    const cleanup = initNetworkListener()
    checkPending()
    return cleanup
  }, [])

  return { isOnline, isSyncing, pendingCount, syncPendingOperations }
}
