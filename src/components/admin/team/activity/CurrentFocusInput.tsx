'use client'

/**
 * Current Focus Input Component
 *
 * Quick input for updating "what I'm working on" status
 */

import { useState, useMemo } from 'react'
import { Target, Loader2, Check, X, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { useCurrentFocus } from './useActivityStream'
import { focusFreshness } from '@/lib/team/focus-freshness'

interface CurrentFocusInputProps {
  profileId: string
  initialFocus: string | null
  /** When the focus was last saved — drives the freshness badge. */
  initialUpdatedAt?: string | null
  onUpdate?: (newFocus: string | null) => void
  compact?: boolean
}

export function CurrentFocusInput({
  profileId,
  initialFocus,
  initialUpdatedAt = null,
  onUpdate,
  compact = false,
}: CurrentFocusInputProps) {
  // Track if user has made local edits (reset when initialFocus changes via key prop)
  const [focus, setFocus] = useState(initialFocus || '')
  const [isEditing, setIsEditing] = useState(false)
  // Track the save timestamp locally so the freshness badge updates the moment
  // the focus is saved, without waiting for a server round-trip/refresh.
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt)
  const { saving, error, updateFocus } = useCurrentFocus()

  // Derive hasChanges from current state (no effect needed)
  const hasChanges = useMemo(() => {
    return focus !== (initialFocus || '')
  }, [focus, initialFocus])

  const fresh = focusFreshness(updatedAt)
  const showFreshness = !compact && !isEditing && !hasChanges && focus.trim().length > 0 && fresh !== null

  const handleSave = async () => {
    const newFocus = focus.trim() || null
    const success = await updateFocus(profileId, newFocus)
    if (success) {
      setIsEditing(false)
      setUpdatedAt(newFocus ? new Date().toISOString() : null)
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
      setUpdatedAt(null)
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
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              variant="ghost"
              size="icon"
              className="p-1 text-action hover:bg-action-muted rounded-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={handleCancel} variant="ghost" size="icon" className="p-1 text-text-tertiary">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            className="flex-1 justify-start text-left text-sm text-text-secondary hover:text-text-primary truncate"
          >
            {focus || 'Fokus setzen...'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface-base rounded-lg border border-subtle p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-text-tertiary" />
        <Heading level={3} className="text-text-primary">Aktueller Fokus</Heading>
        {showFreshness && (
          <span
            className={
              fresh!.isStale
                ? 'ml-auto inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                : 'ml-auto inline-flex items-center gap-1 text-[11px] text-text-tertiary'
            }
          >
            {fresh!.isStale && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
            {fresh!.label}
          </span>
        )}
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
