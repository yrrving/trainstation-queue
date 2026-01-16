import { useState } from 'react'
import StartPage from './components/StartPage'
import QueuePage from './components/QueuePage'

export interface QueueItem {
  name: string
  createdAt: number
}

function App() {
  const [view, setView] = useState<'start' | 'queue'>('start')
  const [queueTitle, setQueueTitle] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [locked, setLocked] = useState(false)

  const createQueue = (title: string) => {
    setQueueTitle(title)
    setQueue([])
    setLocked(false)
    setView('queue')
  }

  const addToQueue = (name: string) => {
    setQueue([...queue, { name, createdAt: Date.now() }])
  }

  const removeFromQueue = (index: number) => {
    setQueue(queue.filter((_, i) => i !== index))
  }

  const toggleLock = (code?: string) => {
    if (locked && code === '999999') {
      setLocked(false)
    } else if (!locked) {
      setLocked(true)
    }
  }

  const resetQueue = () => {
    setView('start')
    setQueueTitle('')
    setQueue([])
    setLocked(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {view === 'start' ? (
        <StartPage onCreateQueue={createQueue} />
      ) : (
        <QueuePage
          queueTitle={queueTitle}
          queue={queue}
          locked={locked}
          onAddToQueue={addToQueue}
          onRemoveFromQueue={removeFromQueue}
          onToggleLock={toggleLock}
          onReset={resetQueue}
        />
      )}
    </div>
  )
}

export default App
