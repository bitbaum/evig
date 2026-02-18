'use client'

import { Sparkles, Loader2, Mic, Camera } from 'lucide-react'

interface Props {
  query: string
  isLoading: boolean
  error: string | null
  success: string | null
  onQueryChange: (value: string) => void
  onSubmit: () => void
}

export function SmartEntrySection({ query, isLoading, error, success, onQueryChange, onSubmit }: Props) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-600 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Entry</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gib einfach den Produktnamen ein und die KI füllt das Formular aus
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder="z.B. Dell Latitude e7470, ThinkPad T480, MacBook Pro 2019..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Suche...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Erkennen
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
          title="Spracheingabe (bald verfügbar)"
        >
          <Mic className="w-4 h-4" />
          Sprache
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
          title="Bilderkennung (bald verfügbar)"
        >
          <Camera className="w-4 h-4" />
          Foto
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 self-center ml-2">
          Sprache & Foto bald verfügbar
        </span>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}
    </div>
  )
}
