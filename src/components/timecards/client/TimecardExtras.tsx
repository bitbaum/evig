'use client'

import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { UseTimecardDraftResult } from '../useTimecardDraft'

/** Owns the "Extras" disclosure section: month note textarea and the reset-month action. */
export function TimecardExtras({
  tc,
  extrasOpen,
  setExtrasOpen,
}: {
  tc: UseTimecardDraftResult
  extrasOpen: boolean
  setExtrasOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const t = useTranslations('admin.timecards')

  return (
    <section className="border-t border-subtle pt-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setExtrasOpen(o => !o)}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary hover:text-text-secondary h-auto px-0"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform ${extrasOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
        {t('extrasToggle')}
      </Button>

      {extrasOpen && (
        <div className="mt-5 space-y-5">
          <label className="block">
            <Eyebrow as="span">
              {t('extrasMonthComment')}
            </Eyebrow>
            <Textarea
              variant="elevated"
              rows={2}
              value={tc.draft.notes}
              onChange={e => tc.setNotes(e.target.value)}
              placeholder={t('extrasMonthCommentPlaceholder')}
              className="mt-1 resize-none"
            />
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={tc.rebuildCurrentDraft}
            className="text-sm text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline h-auto px-0"
          >
            {t('extrasResetMonth')}
          </Button>
        </div>
      )}
    </section>
  )
}
