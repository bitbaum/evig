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
        <Target className="w-4 h-4 text-text-tertiary shrink-0" />
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Woran arbeitest du?"
              maxLength={200}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="p-1 text-action hover:bg-action-muted-muted rounded-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <Button onClick={handleCancel} variant="ghost" size="icon" className="p-1 text-text-tertiary">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm text-text-secondary hover:text-text-primary truncate"
          >
            {focus || 'Fokus setzen...'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface-base rounded-xl border border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-text-tertiary" />
        <Heading level={3} className="text-text-primary">Aktueller Fokus</Heading>
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {focus.length}/200
          </span>
        </div>

        {isEditing && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              Teile deinem Team mit, woran du arbeitest
            </p>
            <div className="flex gap-2">
              {initialFocus && (
                <Button
                  variant="destructive-ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={saving}
                >
                  Löschen
                </Button>
              )}
              <Button onClick={handleCancel} variant="ghost" size="sm">
                Abbrechen
              </Button>
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
