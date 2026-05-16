'use client'

/**
 * Current Focus Input Component
 *
 * Quick input for updating "what I'm working on" status
 */

import { useState, useMemo } from 'react'
import { Target, Loader2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { useCurrentFocus } from './useActivityStream'

interface CurrentFocusInputProps {
  profileId: string
  initialFocus: string | null
  onUpdate?: (newFocus: string | null) => void
  compact?: boolean
}

export function CurrentFocusInput({
  profileId,
  initialFocus,
  onUpdate,
  compact = false,
}: CurrentFocusInputProps) {
  // Track if user has made local edits (reset when initialFocus changes via key prop)
  const [focus, setFocus] = useState(initialFocus || '')
  const [isEditing, setIsEditing] = useState(false)
  const { saving, error, updateFocus } = useCurrentFocus()

  // Derive hasChanges from current state (no effect needed)
  const hasChanges = useMemo(() => {
    return focus !== (initialFocus || '')
  }, [focus, initialFocus])

  const handleSave = async () => {
    const newFocus = focus.trim() || null
    const success = await updateFocus(profileId, newFocus)
    if (success) {
      setIsEditing(false)
      onUpdate?.(newFocus)
    }
  }

  const handleCancel = () => {
    setFocus(initialFocus || '')
    setIsEditing(false)
  }

  const handleClear = async () => {
    const success = await updateFocus(profileId, null)
    if (success) {
      setFocus('')
      setIsEditing(false)
      onUpdate?.(null)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-neutral-500 flex-shrink-0" />
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Woran arbeitest du?"
              maxLength={200}
              className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 truncate"
          >
            {focus || 'Fokus setzen...'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-neutral-500" />
        <Heading level={3} className="text-neutral-900 dark:text-neutral-100">Aktueller Fokus</Heading>
      </div>

      {error && (
        <div className="mb-3 p-2 text-sm text-error-600 bg-error-50 dark:bg-error-900/30 dark:text-error-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Input
            type="text"
            value={focus}
            onChange={(e) => {
              setFocus(e.target.value)
              setIsEditing(true)
            }}
            placeholder="Woran arbeitest du gerade?"
            maxLength={200}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
            {focus.length}/200
          </span>
        </div>

        {isEditing && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Teile deinem Team mit, woran du arbeitest
            </p>
            <div className="flex gap-2">
              {initialFocus && (
                <button
                  onClick={handleClear}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg disabled:opacity-50"
                >
                  Löschen
                </button>
              )}
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
              >
                Abbrechen
              </button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                variant="primary"
                size="sm"
                className="gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
