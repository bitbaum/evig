'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatDateShort } from '@/lib/date-formats'
import { LISTING_QUESTION_STATUS } from '@/config/marketplace'
import { adminInteractive, adminTable } from '@/lib/admin-ui'
import { StatusBadge } from '@/components/ui/status-badge'
import type { PaginatedResponse, QuestionRow } from './types'

interface QuestionsTabProps {
  questions: PaginatedResponse<QuestionRow> | null
  filter: { status: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
  onModerate: (id: string, action: 'hide' | 'restore') => void
}

export function QuestionsTab({
  questions,
  filter,
  setFilter,
  offset,
  setOffset,
  onModerate,
}: QuestionsTabProps) {
  const t = useTranslations('admin.marketplace.questions')
  const tPag = useTranslations('admin.pagination')

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select
          value={filter.status}
          onChange={e => {
            setFilter({ status: e.target.value })
            setOffset(0)
          }}
          className="w-auto"
        >
          <option value={LISTING_QUESTION_STATUS.OPEN}>{t('filters.open')}</option>
          <option value={LISTING_QUESTION_STATUS.ANSWERED}>{t('filters.answered')}</option>
          <option value={LISTING_QUESTION_STATUS.HIDDEN}>{t('filters.hidden')}</option>
          <option value="all">{t('filters.all')}</option>
        </Select>
      </div>

      <div className="bg-surface-base rounded-xl border border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.listing')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.question')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.asker')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.date')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.status')}</th>
              <th className="px-4 py-3 font-medium text-text-secondary">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-white/4">
            {questions?.items.map(q => (
              <tr key={q.id} className={adminTable.tr}>
                <td className="px-4 py-3">
                  <a href={`/marketplace/${q.listing_id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-action flex items-center gap-1">
                    {q.listing_title} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-text-tertiary">{t('sellerLabel', { name: q.seller_name || q.seller_email })}</p>
                </td>
                <td className="px-4 py-3 max-w-md">
                  <p className="font-medium text-text-primary">{q.question}</p>
                  {q.answer && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      {t('answerLabel')}: {q.answer}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{q.asker_name || q.asker_email}</td>
                <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">{formatDateShort(q.created_at)}</td>
                <td className="px-4 py-3">
                  {q.status === LISTING_QUESTION_STATUS.HIDDEN ? (
                    <StatusBadge variant="neutral">{t('status.hidden')}</StatusBadge>
                  ) : q.status === LISTING_QUESTION_STATUS.ANSWERED ? (
                    <StatusBadge variant="success">{t('status.answered')}</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning">{t('status.open')}</StatusBadge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {q.status === LISTING_QUESTION_STATUS.HIDDEN ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onModerate(q.id, 'restore')}
                      className={`px-3 py-1.5 text-sm rounded-lg border border ${adminInteractive.rowHover}`}
                    >
                      {t('actions.restore')}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onModerate(q.id, 'hide')}
                      className={`px-3 py-1.5 text-sm rounded-lg border border ${adminInteractive.rowHover}`}
                    >
                      {t('actions.hide')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {questions && questions.items.length === 0 && (
          <div className="p-8 text-center text-text-tertiary">{t('empty')}</div>
        )}
      </div>

      {questions && questions.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{t('countLabel', { count: questions.pagination.total })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
            <Button variant="outline" size="sm" disabled={!questions.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
