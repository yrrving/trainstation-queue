import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { QueueItem, Queue } from '../App'

interface QueuePageProps {
  queue: Queue
  onAddToQueue: (name: string) => void
  onRemoveFromQueue: (itemId: string) => void
  onToggleLock: (code?: string) => void
  onReorderQueue: (items: QueueItem[]) => void
  onBack: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

interface SortableItemProps {
  item: QueueItem
  index: number
  locked: boolean
  onRemove: (itemId: string) => void
}

function SortableItem({ item, index, locked, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: locked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const stateClass = `queue-item-${item.state}`

  const handleRemove = () => {
    if (window.confirm('Är du säker på att du vill ta bort?')) {
      onRemove(item.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`queue-item ${stateClass} ${!locked ? 'queue-item-draggable' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="queue-item-content">
        <div className="queue-item-left">
          {!locked && <span className="drag-handle">☰</span>}
          <span className="queue-item-number">{index + 1}</span>
          <div className="queue-item-info">
            <span className="queue-item-name">{item.name}</span>
            <span className="queue-item-time">
              {formatTime(item.sessionStart)} – {formatTime(item.sessionEnd)}
            </span>
          </div>
        </div>
        <div className="queue-item-right">
          {item.state === 'active' && (
            <span className="queue-badge queue-badge-active">Nu</span>
          )}
          {item.state === 'next-up' && (
            <span className="queue-badge queue-badge-next">Nästa snart</span>
          )}
          {item.state === 'completed' && (
            <span className="queue-badge queue-badge-completed">Klar</span>
          )}
        </div>
      </div>
      {!locked && (
        <button
          onClick={handleRemove}
          className="queue-item-remove"
          onPointerDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function QueuePage({
  queue,
  onAddToQueue,
  onRemoveFromQueue,
  onToggleLock,
  onReorderQueue,
  onBack,
}: QueuePageProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [unlockCode, setUnlockCode] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddName = () => {
    if (newName.trim()) {
      onAddToQueue(newName.trim())
      setNewName('')
      setShowAddDialog(false)
    }
  }

  const handleUnlock = () => {
    onToggleLock(unlockCode)
    setUnlockCode('')
    setShowUnlockDialog(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = queue.items.findIndex((item) => item.id === active.id)
    const newIndex = queue.items.findIndex((item) => item.id === over.id)

    const reorderedItems = arrayMove(queue.items, oldIndex, newIndex)
    onReorderQueue(reorderedItems)
  }

  return (
    <div className="queue-page">
      <header className="queue-header">
        <button onClick={onBack} className="back-button">
          ← Tillbaka till översikt
        </button>
        <h1>{queue.queueTitle}</h1>
        <p className="queue-time-info">
          {queue.activeTimeStart} – {queue.activeTimeEnd} · {queue.sessionLengthMinutes} min per person
        </p>
      </header>

      <div className="queue-area">
        {queue.items.length === 0 ? (
          <p className="queue-empty">Ingen i kön än</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={queue.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {queue.items.map((item, index) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  index={index}
                  locked={queue.locked}
                  onRemove={onRemoveFromQueue}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <footer className="queue-footer">
        <div className="queue-actions">
          <button
            onClick={() => setShowAddDialog(true)}
            disabled={queue.locked}
            className="btn btn-primary"
          >
            Lägg till
          </button>

          <button
            onClick={() => queue.locked ? setShowUnlockDialog(true) : onToggleLock()}
            className={queue.locked ? 'btn btn-danger' : 'btn btn-warning'}
          >
            {queue.locked ? 'Lås upp' : 'Lås'}
          </button>
        </div>

        {queue.locked && (
          <p className="queue-lock-notice">
            Kön är låst - ingen kan lägga till, ta bort eller flytta
          </p>
        )}
      </footer>

      {showAddDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Lägg till i kö</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Namn"
              className="form-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
            />
            <div className="dialog-actions">
              <button
                onClick={handleAddName}
                className="btn btn-primary"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setNewName('')
                  setShowAddDialog(false)
                }}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnlockDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Lås upp kö</h2>
            <input
              type="password"
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              placeholder="Ange kod"
              className="form-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="dialog-actions">
              <button
                onClick={handleUnlock}
                className="btn btn-primary"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setUnlockCode('')
                  setShowUnlockDialog(false)
                }}
                className="btn btn-secondary"
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
