import { useState, useEffect, useRef } from 'react'
import StartPage from './components/StartPage'
import QueuePage from './components/QueuePage'
import OverviewPage from './components/OverviewPage'
import { saveToStorage, loadFromStorage } from './utils/storage'

export interface QueueItem {
  id: string
  name: string
  createdAt: number
  sessionStart: Date
  sessionEnd: Date
  state: 'waiting' | 'next-up' | 'active' | 'completed'
  orderIndex: number
}

export interface QueueSettings {
  title: string
  activeTimeStart: string // HH:mm format
  activeTimeEnd: string
  sessionLengthMinutes: number
}

export interface Queue {
  queueId: string
  queueTitle: string
  activeTimeStart: string
  activeTimeEnd: string
  sessionLengthMinutes: number
  locked: boolean
  items: QueueItem[]
  lastUpdatedAt: number
}

type View = 'overview' | 'start' | 'queue'

function App() {
  const [view, setView] = useState<View>('overview')
  const [queues, setQueues] = useState<Queue[]>([])
  const [globalLocked, setGlobalLocked] = useState(false)
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null)
  const lastKnownGoodState = useRef<Queue[]>([])
  const isInitialized = useRef(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return

    const loaded = loadFromStorage()
    if (loaded) {
      console.log('[App] Hydrating from localStorage:', loaded.queues.length, 'queues, globalLocked:', loaded.globalLocked)
      setQueues(loaded.queues)
      setGlobalLocked(loaded.globalLocked)
      lastKnownGoodState.current = loaded.queues
    }

    isInitialized.current = true
  }, [])

  // Save to localStorage whenever queues or globalLocked change
  useEffect(() => {
    if (!isInitialized.current) return

    // Validate before saving
    if (!Array.isArray(queues)) {
      console.error('[App] Invalid queues state, reverting to last known good')
      setQueues(lastKnownGoodState.current)
      return
    }

    // Save to localStorage
    const success = saveToStorage(queues, globalLocked)
    if (success) {
      lastKnownGoodState.current = queues
    }
  }, [queues, globalLocked])

  const getCurrentQueue = (): Queue | null => {
    if (!currentQueueId) return null
    return queues.find(q => q.queueId === currentQueueId) || null
  }

  const createQueue = (newSettings: QueueSettings) => {
    const newQueue: Queue = {
      queueId: crypto.randomUUID(),
      queueTitle: newSettings.title,
      activeTimeStart: newSettings.activeTimeStart,
      activeTimeEnd: newSettings.activeTimeEnd,
      sessionLengthMinutes: newSettings.sessionLengthMinutes,
      locked: false,
      items: [],
      lastUpdatedAt: Date.now()
    }

    console.log('[App] Creating queue:', newQueue.queueId, newQueue.queueTitle)
    setQueues([...queues, newQueue])
    setCurrentQueueId(newQueue.queueId)
    setView('queue')
  }

  const calculateSessionTimes = (queue: Queue, index: number): { start: Date; end: Date } => {
    const today = new Date()
    const [startHour, startMinute] = queue.activeTimeStart.split(':').map(Number)

    const sessionStart = new Date(today)
    sessionStart.setHours(startHour, startMinute, 0, 0)
    sessionStart.setMinutes(sessionStart.getMinutes() + index * queue.sessionLengthMinutes)

    const sessionEnd = new Date(sessionStart)
    sessionEnd.setMinutes(sessionEnd.getMinutes() + queue.sessionLengthMinutes)

    return { start: sessionStart, end: sessionEnd }
  }

  const addToQueue = (name: string) => {
    const queue = getCurrentQueue()
    if (!queue) return

    const newIndex = queue.items.length
    const { start, end } = calculateSessionTimes(queue, newIndex)

    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      sessionStart: start,
      sessionEnd: end,
      state: 'waiting',
      orderIndex: newIndex
    }

    const updatedQueues = queues.map(q =>
      q.queueId === queue.queueId
        ? { ...q, items: [...q.items, newItem], lastUpdatedAt: Date.now() }
        : q
    )

    console.log('[App] Adding to queue:', queue.queueId, 'items:', queue.items.length, '->', queue.items.length + 1)
    setQueues(updatedQueues)
  }

  const removeFromQueue = (itemId: string) => {
    const queue = getCurrentQueue()
    if (!queue) return

    const itemsBefore = queue.items.length
    const updatedItems = queue.items.filter(item => item.id !== itemId)
    const itemsAfter = updatedItems.length

    console.log('[App] Removing from queue:', queue.queueId, 'items:', itemsBefore, '->', itemsAfter)

    // Recalculate session times for all items
    const recalculatedItems = updatedItems.map((item, idx) => {
      const { start, end } = calculateSessionTimes(queue, idx)
      return {
        ...item,
        sessionStart: start,
        sessionEnd: end,
        orderIndex: idx
      }
    })

    const updatedQueues = queues.map(q =>
      q.queueId === queue.queueId
        ? { ...q, items: recalculatedItems, lastUpdatedAt: Date.now() }
        : q
    )

    setQueues(updatedQueues)
  }

  const reorderQueue = (queueId: string, reorderedItems: QueueItem[]) => {
    const queue = queues.find(q => q.queueId === queueId)
    if (!queue) {
      console.error('[App] Reorder: queue not found:', queueId)
      return
    }

    // CRITICAL VALIDATION: Ensure we don't lose items
    if (!Array.isArray(reorderedItems)) {
      console.error('[App] Reorder: invalid items array')
      return
    }

    if (reorderedItems.length !== queue.items.length) {
      console.error('[App] Reorder: length mismatch!', queue.items.length, '->', reorderedItems.length, 'ABORTING')
      return
    }

    // Validate all items have IDs
    const allHaveIds = reorderedItems.every(item => item && item.id)
    if (!allHaveIds) {
      console.error('[App] Reorder: some items missing IDs, ABORTING')
      return
    }

    console.log('[App] Reordering queue:', queueId, 'items:', reorderedItems.length)

    // Recalculate session times based on new order
    const recalculatedItems = reorderedItems.map((item, idx) => {
      const { start, end } = calculateSessionTimes(queue, idx)
      return {
        ...item,
        sessionStart: start,
        sessionEnd: end,
        orderIndex: idx
      }
    })

    // Final validation
    if (recalculatedItems.length !== queue.items.length) {
      console.error('[App] Reorder: recalculation changed length! ABORTING')
      return
    }

    const updatedQueues = queues.map(q =>
      q.queueId === queueId
        ? { ...q, items: recalculatedItems, lastUpdatedAt: Date.now() }
        : q
    )

    setQueues(updatedQueues)
  }

  const updateQueueStates = (queue: Queue): QueueItem[] => {
    if (queue.items.length === 0) return []

    const now = new Date()

    return queue.items.map((item) => {
      const isActive = now >= item.sessionStart && now < item.sessionEnd
      const isCompleted = now >= item.sessionEnd

      // Check if next up (within 2 minutes of current session ending)
      const currentActive = queue.items.find(q => {
        const active = now >= q.sessionStart && now < q.sessionEnd
        return active
      })

      let isNextUp = false
      if (currentActive) {
        const timeUntilCurrentEnds = (currentActive.sessionEnd.getTime() - now.getTime()) / 1000 / 60
        const isNextInLine = queue.items.indexOf(item) === queue.items.indexOf(currentActive) + 1
        isNextUp = isNextInLine && timeUntilCurrentEnds <= 2
      }

      let state: QueueItem['state'] = 'waiting'
      if (isCompleted) state = 'completed'
      else if (isActive) state = 'active'
      else if (isNextUp) state = 'next-up'

      return { ...item, state }
    })
  }

  const toggleLock = (queueId: string, code?: string) => {
    const queue = queues.find(q => q.queueId === queueId)
    if (!queue) return

    if (queue.locked && code === '999999') {
      console.log('[App] Unlocking queue:', queueId)
      const updatedQueues = queues.map(q =>
        q.queueId === queueId ? { ...q, locked: false, lastUpdatedAt: Date.now() } : q
      )
      setQueues(updatedQueues)
    } else if (!queue.locked) {
      console.log('[App] Locking queue:', queueId)
      const updatedQueues = queues.map(q =>
        q.queueId === queueId ? { ...q, locked: true, lastUpdatedAt: Date.now() } : q
      )
      setQueues(updatedQueues)
    }
  }

  const resetSingleQueue = (queueId: string) => {
    console.log('[App] Resetting queue:', queueId)
    const updatedQueues = queues.map(q =>
      q.queueId === queueId ? { ...q, items: [], lastUpdatedAt: Date.now() } : q
    )
    setQueues(updatedQueues)
  }

  const deleteSingleQueue = (queueId: string) => {
    console.log('[App] Deleting queue:', queueId)
    const updatedQueues = queues.filter(q => q.queueId !== queueId)
    setQueues(updatedQueues)
    if (currentQueueId === queueId) {
      setCurrentQueueId(null)
      setView('overview')
    }
  }

  const resetAllQueues = (code: string) => {
    if (code !== '999999') {
      console.log('[App] Reset all queues: incorrect code')
      return false
    }

    console.log('[App] Resetting all queues')
    setQueues([])
    setCurrentQueueId(null)
    setView('overview')
    return true
  }

  const toggleGlobalLock = (code?: string) => {
    if (globalLocked && code === '999999') {
      console.log('[App] Unlocking globally')
      setGlobalLocked(false)
    } else if (!globalLocked) {
      console.log('[App] Locking globally')
      setGlobalLocked(true)
    } else {
      console.log('[App] Toggle global lock: incorrect code')
    }
  }

  const openQueue = (queueId: string) => {
    setCurrentQueueId(queueId)
    setView('queue')
  }

  const backToOverview = () => {
    setCurrentQueueId(null)
    setView('overview')
  }

  // Timer to update all queue states every minute
  useEffect(() => {
    if (queues.length === 0) return

    // Initial update immediately
    const initialUpdate = () => {
      const updatedQueues = queues.map(queue => ({
        ...queue,
        items: updateQueueStates(queue),
        lastUpdatedAt: Date.now()
      }))

      // Only update if states actually changed
      const hasChanges = updatedQueues.some((q, i) => {
        const oldItems = queues[i].items
        const newItems = q.items
        return newItems.some((item, j) => item.state !== oldItems[j]?.state)
      })

      if (hasChanges) {
        console.log('[App] Timer: updating queue states')
        setQueues(updatedQueues)
      }
    }

    initialUpdate()

    // Update every 60 seconds
    const interval = setInterval(() => {
      initialUpdate()
    }, 60000)

    return () => clearInterval(interval)
  }, [queues.length])

  const currentQueue = getCurrentQueue()

  return (
    <>
      {view === 'overview' && (
        <OverviewPage
          queues={queues}
          globalLocked={globalLocked}
          onOpenQueue={openQueue}
          onCreateNew={() => setView('start')}
          onResetQueue={resetSingleQueue}
          onDeleteQueue={deleteSingleQueue}
          onResetAll={resetAllQueues}
          onToggleGlobalLock={toggleGlobalLock}
        />
      )}

      {view === 'start' && (
        <StartPage onCreateQueue={createQueue} />
      )}

      {view === 'queue' && currentQueue && (
        <QueuePage
          queue={currentQueue}
          onAddToQueue={addToQueue}
          onRemoveFromQueue={removeFromQueue}
          onToggleLock={(code) => toggleLock(currentQueue.queueId, code)}
          onReorderQueue={(items) => reorderQueue(currentQueue.queueId, items)}
          onBack={backToOverview}
        />
      )}
    </>
  )
}

export default App
