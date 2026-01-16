import { useState } from 'react'
import type { Queue } from '../App'

interface OverviewPageProps {
  queues: Queue[]
  globalLocked: boolean
  onOpenQueue: (queueId: string) => void
  onCreateNew: () => void
  onResetQueue: (queueId: string) => void
  onDeleteQueue: (queueId: string) => void
  onResetAll: (code: string) => boolean
  onToggleGlobalLock: (code?: string) => void
}

export default function OverviewPage({
  queues,
  globalLocked,
  onOpenQueue,
  onCreateNew,
  onResetQueue,
  onDeleteQueue,
  onResetAll,
  onToggleGlobalLock,
}: OverviewPageProps) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetTargetId, setResetTargetId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [showResetAllDialog, setShowResetAllDialog] = useState(false)
  const [showResetAllCodeDialog, setShowResetAllCodeDialog] = useState(false)
  const [resetAllCode, setResetAllCode] = useState('')
  const [showGlobalUnlockDialog, setShowGlobalUnlockDialog] = useState(false)
  const [globalUnlockCode, setGlobalUnlockCode] = useState('')

  const handleResetQueue = (queueId: string) => {
    setResetTargetId(queueId)
    setShowResetDialog(true)
  }

  const confirmReset = () => {
    if (resetTargetId) {
      onResetQueue(resetTargetId)
    }
    setResetTargetId(null)
    setShowResetDialog(false)
  }

  const handleDeleteQueue = (queueId: string) => {
    setDeleteTargetId(queueId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteQueue(deleteTargetId)
    }
    setDeleteTargetId(null)
    setShowDeleteDialog(false)
  }

  const handleResetAll = () => {
    setShowResetAllDialog(true)
  }

  const confirmResetAll = () => {
    // After confirmation, show code dialog
    setShowResetAllDialog(false)
    setShowResetAllCodeDialog(true)
  }

  const submitResetAllCode = () => {
    const success = onResetAll(resetAllCode)
    if (success) {
      setShowResetAllCodeDialog(false)
      setResetAllCode('')
    } else {
      // Show error or just clear
      alert('Fel kod')
      setResetAllCode('')
    }
  }

  const handleGlobalUnlock = () => {
    onToggleGlobalLock(globalUnlockCode)
    setGlobalUnlockCode('')
    setShowGlobalUnlockDialog(false)
  }

  const getQueueSummary = (queue: Queue) => {
    if (queue.items.length === 0) {
      return {
        currentPerson: '—',
        nextPerson: '—',
        queueLength: 0
      }
    }

    // Find active item (person whose turn it is now)
    const activeItem = queue.items.find(item => item.state === 'active')

    let currentPerson: string
    let nextPerson: string
    let currentIndex: number

    if (activeItem) {
      // Someone is active right now
      currentIndex = queue.items.indexOf(activeItem)
      currentPerson = activeItem.name
    } else {
      // No one is active yet, show first person
      currentIndex = 0
      currentPerson = queue.items[0].name
    }

    // Next person is the one after current (if exists)
    const nextIndex = currentIndex + 1
    if (nextIndex < queue.items.length) {
      nextPerson = queue.items[nextIndex].name
    } else {
      // No one after current person
      nextPerson = '—'
    }

    return {
      currentPerson,
      nextPerson,
      queueLength: queue.items.length
    }
  }

  return (
    <div className="overview-page">
      <header className="overview-header">
        <h1>Alla köer</h1>
        <div className="overview-actions">
          <button onClick={onCreateNew} className="btn btn-primary">
            Skapa ny kö
          </button>
          {queues.length > 0 && (
            <button
              onClick={handleResetAll}
              disabled={globalLocked}
              className="btn btn-danger"
            >
              Radera alla köer
            </button>
          )}
        </div>
      </header>

      <div className="overview-grid">
        {queues.length === 0 ? (
          <div className="overview-empty">
            <p>Inga köer ännu</p>
            <button onClick={onCreateNew} className="btn btn-primary">
              Skapa din första kö
            </button>
          </div>
        ) : (
          queues.map((queue) => {
            const summary = getQueueSummary(queue)
            const isLocked = queue.locked

            return (
              <div key={queue.queueId} className="queue-card">
                <div className="queue-card-header">
                  <h2>{queue.queueTitle}</h2>
                  {isLocked && <span className="lock-badge">🔒</span>}
                </div>

                <div className="queue-card-body">
                  <div className="queue-card-info">
                    <span className="info-label">Tid:</span>
                    <span className="info-value">
                      {queue.activeTimeStart} – {queue.activeTimeEnd}
                    </span>
                  </div>

                  <div className="queue-card-info">
                    <span className="info-label">Session:</span>
                    <span className="info-value">{queue.sessionLengthMinutes} min</span>
                  </div>

                  <div className="queue-card-info">
                    <span className="info-label">I kö:</span>
                    <span className="info-value">{summary.queueLength} personer</span>
                  </div>

                  <div className="queue-card-people">
                    <div className="person-info">
                      <span className="person-label">Nu:</span>
                      <span className="person-name">{summary.currentPerson}</span>
                    </div>
                    <div className="person-info">
                      <span className="person-label">Nästa:</span>
                      <span className="person-name">{summary.nextPerson}</span>
                    </div>
                  </div>
                </div>

                <div className="queue-card-actions">
                  <button
                    onClick={() => onOpenQueue(queue.queueId)}
                    className="btn btn-primary"
                  >
                    Öppna kö
                  </button>
                  {!isLocked && !globalLocked && (
                    <>
                      <button
                        onClick={() => handleResetQueue(queue.queueId)}
                        className="btn btn-secondary"
                      >
                        Rensa kö
                      </button>
                      <button
                        onClick={() => handleDeleteQueue(queue.queueId)}
                        className="btn btn-danger"
                      >
                        Ta bort
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Global Lock Footer */}
      {queues.length > 0 && (
        <footer className="overview-footer">
          <button
            onClick={() => globalLocked ? setShowGlobalUnlockDialog(true) : onToggleGlobalLock()}
            className={globalLocked ? 'btn btn-danger' : 'btn btn-warning'}
          >
            {globalLocked ? 'Lås upp översikt' : 'Lås översikt'}
          </button>

          {globalLocked && (
            <p className="overview-lock-notice">
              Översikten är låst - inga destruktiva åtgärder tillåtna
            </p>
          )}
        </footer>
      )}

      {/* Reset Queue Dialog */}
      {showResetDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Rensa kö</h2>
            <p>Detta tar bort alla personer från kön. Vill du fortsätta?</p>
            <div className="dialog-actions">
              <button onClick={confirmReset} className="btn btn-danger">
                Ja, rensa
              </button>
              <button
                onClick={() => {
                  setShowResetDialog(false)
                  setResetTargetId(null)
                }}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Queue Dialog */}
      {showDeleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Ta bort kö</h2>
            <p>Detta tar bort hela kön permanent. Vill du fortsätta?</p>
            <div className="dialog-actions">
              <button onClick={confirmDelete} className="btn btn-danger">
                Ja, ta bort
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteTargetId(null)
                }}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Dialog */}
      {showResetAllDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Radera alla köer</h2>
            <p>Detta tar bort alla köer permanent. Vill du fortsätta?</p>
            <div className="dialog-actions">
              <button onClick={confirmResetAll} className="btn btn-danger">
                Ja, radera allt
              </button>
              <button
                onClick={() => setShowResetAllDialog(false)}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Code Dialog */}
      {showResetAllCodeDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Ange säkerhetskod</h2>
            <p>Ange kod för att radera alla köer</p>
            <input
              type="password"
              value={resetAllCode}
              onChange={(e) => setResetAllCode(e.target.value)}
              placeholder="Ange kod"
              className="form-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submitResetAllCode()}
            />
            <div className="dialog-actions">
              <button onClick={submitResetAllCode} className="btn btn-danger">
                Bekräfta
              </button>
              <button
                onClick={() => {
                  setShowResetAllCodeDialog(false)
                  setResetAllCode('')
                }}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Unlock Dialog */}
      {showGlobalUnlockDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Lås upp översikt</h2>
            <input
              type="password"
              value={globalUnlockCode}
              onChange={(e) => setGlobalUnlockCode(e.target.value)}
              placeholder="Ange kod"
              className="form-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleGlobalUnlock()}
            />
            <div className="dialog-actions">
              <button onClick={handleGlobalUnlock} className="btn btn-primary">
                OK
              </button>
              <button
                onClick={() => {
                  setShowGlobalUnlockDialog(false)
                  setGlobalUnlockCode('')
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
