'use client'

import { AlertCircle, Check, RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Header strip for the monthly timecard view: title + helper line +
 * primary actions (submit / reset / save) + status banners. The grouped
 * shape lets the parent stay declarative.
 */
export function TimecardHeader({
  monthLabel,
  hasSchedule,
  hasEntries,
  isSaving,
  isSubmitting,
  isLoadingDraft,
  errorMessage,
  syncMessage,
  onSubmit,
  onReset,
  onSave,
}: {
  monthLabel: string
  hasSchedule: boolean
  hasEntries: boolean
  isSaving: boolean
  isSubmitting: boolean
  isLoadingDraft: boolean
  errorMessage: string | null
  syncMessage: string | null
  onSubmit: () => void
  onReset: () => void
  onSave: () => void
}) {
  const helperText = hasSchedule
    ? 'Dein Monat ist aus dem offiziellen Schedule vorbereitet. Du musst nur bestätigen oder Ausnahmen eintragen.'
    : 'Lege zuerst deinen offiziellen Schedule im Team-Profil fest. Danach ist die Zeitkarte automatisch vorbereitet.'

  return (
    <div className="rounded-lg border bg-surface-base p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">
            {`${monthLabel} ist vorbereitet`}
          </h2>
          <p className="mt-1 text-sm text-text-tertiary">{helperText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            disabled={isSubmitting || !hasEntries || isLoadingDraft}
            className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-3 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:bg-surface-overlay disabled:text-text-tertiary"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sende…' : 'Zur Prüfung einreichen'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface-base px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            <RotateCcw className="h-4 w-4" />
            Vorlage zurücksetzen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={isSaving || isLoadingDraft}
            className="inline-flex items-center gap-2 rounded-lg border border-default bg-surface-base px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Speichere…' : 'Entwurf speichern'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {syncMessage && (
        <p className="mt-3 text-sm text-success-700">{syncMessage}</p>
      )}
    </div>
  )
}
