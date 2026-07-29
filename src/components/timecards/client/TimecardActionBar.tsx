'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import type { TimecardStatus } from '@/config/timecards'
import type { UseTimecardDraftResult } from '../useTimecardDraft'

/** Owns the sticky bottom action bar: inline feedback line plus the reopen / save / submit button cluster. */
export function TimecardActionBar({
  tc,
  serverStatus,
  isApproved,
  isSubmittedUnchanged,
  canApprove,
}: {
  tc: UseTimecardDraftResult
  serverStatus: TimecardStatus
  isApproved: boolean
  isSubmittedUnchanged: boolean
  canApprove: boolean
}) {
  const t = useTranslations('admin.timecards')
  const { duration } = useTimecardIntl()

  return (
    <div className="sticky bottom-[var(--bottom-nav-clearance,0px)] z-20 -mx-1 flex flex-col gap-2 border-t border-subtle bg-surface-base/95 py-3 pl-1 pr-20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pr-1">
      {/* Feedback lives NEXT TO the buttons that trigger it — the header
          message is off-screen when the user submits from down here. */}
      {tc.errorMessage ? (
        <p className="flex items-center gap-1.5 text-sm text-error-700 dark:text-error-400">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {tc.errorMessage}
        </p>
      ) : tc.syncMessage ? (
        <p className="flex items-center gap-1.5 text-sm text-text-tertiary">
          <Check className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
          {tc.syncMessage}
        </p>
      ) : (
        <p className="text-sm text-text-tertiary">
          {isApproved
            ? t('lockedApproved')
            : isSubmittedUnchanged
              ? t('submittedUnchanged')
              : `${tc.periodEntries.length} ${t('headerDaysSuffix')} · ${duration(tc.totalMinutes)}`}
        </p>
      )}
      {/* flex-wrap + growing buttons: on a phone a label that doesn't fit
          wraps to its own full-width line instead of pushing the page wide. */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {canApprove && isApproved && tc.draft.id && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const r = await apiFetch(`/api/admin/timecards/${tc.draft.id}/reopen`, { method: 'POST' })
              if (r.success) window.location.reload()
            }}
            className="flex-1 sm:flex-none"
          >
            {t('reopen2')}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={tc.saveDraft}
          disabled={tc.isSaving || tc.isLoadingDraft || isApproved || !tc.isDirty}
          className="flex-1 sm:flex-none"
        >
          {tc.isSaving ? t('saving') : t('save')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={tc.submitDraft}
          disabled={tc.isSubmitting || tc.periodEntries.length === 0 || tc.isLoadingDraft || isApproved || isSubmittedUnchanged}
          className="flex-1 sm:flex-none"
        >
          {tc.isSubmitting ? t('submitting') : serverStatus === 'submitted' ? t('resubmit') : t('submit')}
        </Button>
      </div>
    </div>
  )
}
