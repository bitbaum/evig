'use client'

import { Sparkles, Loader2, Mic, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/30 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800 p-6">
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
          <Input
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 rounded-lg cursor-not-allowed"
          title="Spracheingabe (bald verfügbar)"
        >
          <Mic className="w-4 h-4" />
          Sprache
        </button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 rounded-lg cursor-not-allowed"
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
