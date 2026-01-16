import { useState } from 'react'

interface StartPageProps {
  onCreateQueue: (title: string) => void
}

export default function StartPage({ onCreateQueue }: StartPageProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreateQueue(title.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Skriv vad kön gäller (t.ex. VR, Laser, Musik)"
              className="w-full px-6 py-4 text-lg bg-gray-800/50 border border-gray-700 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-500 text-white"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full px-6 py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700
                       disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50
                       rounded-lg transition-colors duration-200"
          >
            Skapa kö
          </button>
        </form>
      </div>
    </div>
  )
}
