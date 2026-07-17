'use client'

import { AlertCircle, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'

/**
 * Page header for /admin/zeiterfassung.
 *
 * x.ai-style restraint: big month title, single subtle summary line,
 * one primary action ("Einreichen"). The "Save draft" affordance only
 * appears when the user has unsubmitted changes — most of the time it
 * is not visible.
 *
 * No card chrome, no banner. Status surfaces inline via small text
 * below the action row when there is something to say.
 */
export function TimecardHeader({
  monthLabel,
  scheduleSummary,
  totalMinutes,
  entryCount,
  status,
  isDirty,
  hasEntries,
  isSaving,
  isSubmitting,
  isLoadingDraft,
  errorMessage,
  syncMessage,
  onSubmit,
  onSave,
}: {
  monthLabel: string
  scheduleSummary: string
  totalMinutes: number
  entryCount: number
  /** SERVER status of the card — not the keystroke-level local draft status. */
  status: string
  /** Content differs from the last server state (drives save/resubmit). */
  isDirty: boolean
  hasEntries: boolean
  isSaving: boolean
  isSubmitting: boolean
  isLoadingDraft: boolean
  errorMessage: string | null
  syncMessage: string | null
  onSubmit: () => void
  onSave: () => void
}) {
  const isSubmitted = status === 'submitted'
  const isApproved = status === 'approved'
  const t = useTranslations('admin.timecards')
  const { duration } = useTimecardIntl()

  return (
    <header className="border-b border-subtle pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {isSubmitted ? t('headerStatusSubmitted') : t('headerStatusDraft')} · {entryCount}{' '}
            {t('headerDaysSuffix')} · {duration(totalMinutes)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
            {monthLabel}
          </h1>
          <p className="mt-2 text-sm text-text-tertiary">{scheduleSummary}</p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!isSubmitted && hasEntries && (
            <p className="text-xs text-text-tertiary text-right max-w-xs">{t('submitHint')}</p>
          )}
          <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={isSaving || isLoadingDraft || isApproved || !isDirty}
            className="text-sm"
          >
            {isSaving ? t('saving') : t('save')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            disabled={
              isSubmitting || !hasEntries || isLoadingDraft || isApproved ||
              (isSubmitted && !isDirty)
            }
            className="text-sm"
          >
            {isSubmitting ? t('submitting') : isSubmitted ? t('resubmit') : t('submit')}
          </Button>
          </div>
        </div>
      </div>

      {(errorMessage || syncMessage) && (
        <div className="mt-4 text-sm">
          {errorMessage ? (
            <p className="flex items-start gap-2 text-error-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-text-tertiary">
              <Check className="h-4 w-4 text-action" />
              {syncMessage}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
