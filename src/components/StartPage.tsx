import { useState } from 'react'
import type { QueueSettings } from '../App'

interface StartPageProps {
  onCreateQueue: (settings: QueueSettings) => void
}

export default function StartPage({ onCreateQueue }: StartPageProps) {
  const [title, setTitle] = useState('')
  const [activeTimeStart, setActiveTimeStart] = useState('15:00')
  const [activeTimeEnd, setActiveTimeEnd] = useState('17:00')
  const [sessionLength, setSessionLength] = useState(10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && activeTimeStart && activeTimeEnd && sessionLength > 0) {
      onCreateQueue({
        title: title.trim(),
        activeTimeStart,
        activeTimeEnd,
        sessionLengthMinutes: sessionLength
      })
    }
  }

  return (
    <div className="start-page">
      <div className="start-card">
        <h1>Köhantering</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vad gäller kön?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. VR, Laser, Musik"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aktiv tid för kön</label>
            <div className="time-range-inputs">
              <input
                type="time"
                value={activeTimeStart}
                onChange={(e) => setActiveTimeStart(e.target.value)}
                className="form-input"
              />
              <span className="time-separator">–</span>
              <input
                type="time"
                value={activeTimeEnd}
                onChange={(e) => setActiveTimeEnd(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tid per person (minuter)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={sessionLength}
              onChange={(e) => setSessionLength(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || sessionLength <= 0}
            className="btn btn-primary"
          >
            Skapa kö
          </button>
        </form>
      </div>
    </div>
  )
}
