import AsyncStorage from '@react-native-async-storage/async-storage'
import { OfflineOperation, OfflineOperationType } from '@/types'
import { todayString } from './date'

const QUEUE_KEY = '@habit_tracker:offline_queue'

// ─────────────────────────────────────────
// Leer la cola
// ─────────────────────────────────────────

export async function getQueue(): Promise<OfflineOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// Agregar operación a la cola
// ─────────────────────────────────────────

export async function enqueue(
  operation: OfflineOperationType,
  payload: OfflineOperation['payload']
): Promise<void> {
  const queue = await getQueue()

  // Si ya existe la operación inversa para el mismo hábito/fecha, cancelarlas
  const invertOp: OfflineOperationType =
    operation === 'complete_habit' ? 'uncomplete_habit' : 'complete_habit'

  const existingIndex = queue.findIndex(
    (op) =>
      op.operation === invertOp &&
      op.payload.habit_id === payload.habit_id &&
      op.payload.completed_date === payload.completed_date &&
      !op.synced
  )

  if (existingIndex !== -1) {
    // Cancelar la operación inversa (se anulan mutuamente)
    queue.splice(existingIndex, 1)
  } else {
    const newOp: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      payload,
      created_at: new Date().toISOString(),
      synced: false,
    }
    queue.push(newOp)
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

// ─────────────────────────────────────────
// Marcar operaciones como sincronizadas
// ─────────────────────────────────────────

export async function markSynced(ids: string[]): Promise<void> {
  const queue = await getQueue()
  const idSet = new Set(ids)
  const pending = queue.filter((op) => !idSet.has(op.id))
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending))
}

// ─────────────────────────────────────────
// Obtener solo las operaciones pendientes
// ─────────────────────────────────────────

export async function getPendingOperations(): Promise<OfflineOperation[]> {
  const queue = await getQueue()
  return queue.filter((op) => !op.synced)
}

// ─────────────────────────────────────────
// Limpiar operaciones sincronizadas
// ─────────────────────────────────────────

export async function clearSynced(): Promise<void> {
  const queue = await getQueue()
  const pending = queue.filter((op) => !op.synced)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending))
}

// ─────────────────────────────────────────
// Contar operaciones pendientes
// ─────────────────────────────────────────

export async function pendingCount(): Promise<number> {
  const pending = await getPendingOperations()
  return pending.length
}
