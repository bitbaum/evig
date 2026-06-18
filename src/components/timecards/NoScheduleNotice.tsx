'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

/**
 * Inline "set up my schedule" prompt.
 *
 * Replaces the previous loud yellow warning box. Now a single thin
 * row of text + two pill-style actions, in the same visual register as
 * the rest of the page. The page is still usable without a schedule
 * (the day editor's "09:00–17:00 ausfüllen" works), so this is
 * informational + an accelerator, not a blocker.
 *
 * One-tap bootstrap: POST /api/admin/team/profiles/me/bootstrap
 * creates a team_profile with the Mo–Fr 09–17 standard schedule, then
 * reloads so the page re-reads workingHours.
 */
export function NoScheduleNotice({ hasSchedule }: { hasSchedule: boolean }) {
  const t = useTranslations('admin.timecards')
  const [isApplying, setIsApplying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (hasSchedule) return null

  const applyDefault = async () => {
    setIsApplying(true)
    setErrorMessage(null)
    const result = await apiFetch<{ applied: boolean }>(
      '/api/admin/team/profiles/me/bootstrap',
      { method: 'POST' },
    )
    if (!result.success) {
      setErrorMessage(result.error || t('scheduleApplyFailed'))
      setIsApplying(false)
      return
    }
    window.location.reload()
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-subtle bg-surface-raised px-4 py-3">
      <p className="text-sm text-text-secondary">{t('noScheduleLine')}</p>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={applyDefault}
        disabled={isApplying}
        className="inline-flex items-center gap-1.5 rounded-full h-auto"
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {isApplying ? t('applyingSchedule') : t('applyStandardSchedule')}
      </Button>
      <Link
        href={ROUTES.admin.team}
        className="text-xs text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline"
      >
        {t('setOwnSchedule')}
      </Link>
      {errorMessage && (
        <p className="basis-full text-xs text-error-700">{errorMessage}</p>
      )}
    </div>
  )
}
