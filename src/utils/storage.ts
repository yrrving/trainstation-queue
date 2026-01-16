import type { Queue } from '../App'

const STORAGE_KEY = 'trainstation_queue_state_v1'

interface StorageState {
  queues: Queue[]
  globalLocked: boolean
  lastUpdatedAt: number
}

export function saveToStorage(queues: Queue[], globalLocked: boolean): boolean {
  try {
    const state: StorageState = {
      queues,
      globalLocked,
      lastUpdatedAt: Date.now()
    }

    // Validate before saving
    if (!Array.isArray(queues)) {
      console.error('[Storage] Invalid queues array, not saving')
      return false
    }

    const serialized = JSON.stringify(state, (_key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })

    localStorage.setItem(STORAGE_KEY, serialized)
    console.log('[Storage] Saved', queues.length, 'queues, globalLocked:', globalLocked, 'to localStorage')
    return true
  } catch (error) {
    console.error('[Storage] Failed to save:', error)
    return false
  }
}

export function loadFromStorage(): { queues: Queue[], globalLocked: boolean } | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)

    if (!serialized) {
      console.log('[Storage] No saved state found')
      return null
    }

    const state: StorageState = JSON.parse(serialized, (_key, value) => {
      // Convert ISO strings back to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value)
      }
      return value
    })

    // Validate loaded data
    if (!state.queues || !Array.isArray(state.queues)) {
      console.error('[Storage] Invalid state structure')
      return null
    }

    const globalLocked = state.globalLocked ?? false

    console.log('[Storage] Loaded', state.queues.length, 'queues, globalLocked:', globalLocked, 'from localStorage')
    return { queues: state.queues, globalLocked }
  } catch (error) {
    console.error('[Storage] Failed to load:', error)
    return null
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('[Storage] Cleared localStorage')
  } catch (error) {
    console.error('[Storage] Failed to clear:', error)
  }
}
