'use client'

import { Sparkles, Loader2, Mic, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'

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
    <div className="bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-600 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <Heading level={2} className="text-lg text-neutral-900 dark:text-white">Smart Entry</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="gap-2 px-6 py-3"
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
        </Button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-lg cursor-not-allowed"
          title="Spracheingabe (bald verfügbar)"
        >
          <Mic className="w-4 h-4" />
          Sprache
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-lg cursor-not-allowed"
          title="Bilderkennung (bald verfügbar)"
        >
          <Camera className="w-4 h-4" />
          Foto
        </button>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 self-center ml-2">
          Sprache & Foto bald verfügbar
        </span>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <p className="text-sm text-primary-700 dark:text-primary-400">{success}</p>
        </div>
      )}
    </div>
  )
}
