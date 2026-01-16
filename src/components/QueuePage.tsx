import { useState } from 'react'
import { QueueItem } from '../App'

interface QueuePageProps {
  queueTitle: string
  queue: QueueItem[]
  locked: boolean
  onAddToQueue: (name: string) => void
  onRemoveFromQueue: (index: number) => void
  onToggleLock: (code?: string) => void
  onReset: () => void
}

export default function QueuePage({
  queueTitle,
  queue,
  locked,
  onAddToQueue,
  onRemoveFromQueue,
  onToggleLock,
  onReset,
}: QueuePageProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [unlockCode, setUnlockCode] = useState('')

  const handleAddName = () => {
    if (newName.trim()) {
      onAddToQueue(newName.trim())
      setNewName('')
      setShowAddDialog(false)
    }
  }

  const handleRemove = (index: number) => {
    if (window.confirm('Är du säker på att du vill ta bort?')) {
      onRemoveFromQueue(index)
    }
  }

  const handleUnlock = () => {
    onToggleLock(unlockCode)
    setUnlockCode('')
    setShowUnlockDialog(false)
  }

  const handleReset = () => {
    if (window.confirm('Detta tar bort hela kön och går tillbaka till start.')) {
      onReset()
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">{queueTitle}</h1>
      </header>

      {/* Queue Area */}
      <div className="flex-1 flex flex-col items-center justify-start space-y-3 mb-8">
        {queue.length === 0 ? (
          <p className="text-gray-400 text-lg">Ingen i kön än</p>
        ) : (
          queue.map((item, index) => (
            <div
              key={item.createdAt}
              className={`
                w-full max-w-md px-6 py-4 rounded-lg flex items-center justify-between
                ${
                  index === 0
                    ? 'bg-green-600/30 border-2 border-green-500 shadow-lg scale-105'
                    : 'bg-gray-800/50 border border-gray-700'
                }
              `}
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-gray-400">
                  {index + 1}
                </span>
                <span className="text-xl">{item.name}</span>
              </div>
              {!locked && (
                <button
                  onClick={() => handleRemove(index)}
                  className="text-red-400 hover:text-red-300 text-2xl font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Buttons */}
      <footer className="flex flex-col items-center space-y-3">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddDialog(true)}
            disabled={locked}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700
                       disabled:opacity-50 disabled:cursor-not-allowed rounded-lg
                       transition-colors duration-200 font-medium"
          >
            Lägg till
          </button>

          <button
            onClick={() => locked ? setShowUnlockDialog(true) : onToggleLock()}
            className={`px-6 py-3 rounded-lg transition-colors duration-200 font-medium
                       ${
                         locked
                           ? 'bg-red-600 hover:bg-red-700'
                           : 'bg-yellow-600 hover:bg-yellow-700'
                       }`}
          >
            {locked ? 'Lås upp' : 'Lås'}
          </button>

          <button
            onClick={handleReset}
            disabled={locked}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700
                       disabled:opacity-50 disabled:cursor-not-allowed rounded-lg
                       transition-colors duration-200 font-medium"
          >
            Nollställ
          </button>
        </div>

        {locked && (
          <p className="text-sm text-yellow-500">
            🔒 Kön är låst - ingen kan lägga till eller ta bort
          </p>
        )}
      </footer>

      {/* Add Name Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Lägg till i kö</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Namn"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleAddName}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setNewName('')
                  setShowAddDialog(false)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Dialog */}
      {showUnlockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Lås upp kö</h2>
            <input
              type="password"
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              placeholder="Ange kod"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-white mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleUnlock}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setUnlockCode('')
                  setShowUnlockDialog(false)
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
