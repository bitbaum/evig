'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatDateShort } from '@/lib/date-formats'
import { LISTING_QUESTION_STATUS } from '@/config/marketplace'
import { adminInteractive } from '@/lib/admin-ui'
import { StatusBadge } from '@/components/ui/status-badge'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
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

  const columns: AdminTableColumn<QuestionRow>[] = [
    {
      header: t('columns.listing'),
      cell: (q) => (
        <>
          <a href={`/marketplace/${q.listing_id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-action flex items-center gap-1">
            {q.listing_title} <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-text-tertiary">{t('sellerLabel', { name: q.seller_name || q.seller_email })}</p>
        </>
      ),
    },
    {
      header: t('columns.question'),
      className: 'max-w-md',
      cell: (q) => (
        <>
          <p className="font-medium text-text-primary">{q.question}</p>
          {q.answer && (
            <p className="mt-1 text-xs text-text-tertiary">
              {t('answerLabel')}: {q.answer}
            </p>
          )}
        </>
      ),
    },
    {
      header: t('columns.asker'),
      cell: (q) => <span className="text-text-secondary">{q.asker_name || q.asker_email}</span>,
    },
    {
      header: t('columns.date'),
      className: 'whitespace-nowrap',
      cell: (q) => <span className="text-text-tertiary">{formatDateShort(q.created_at)}</span>,
    },
    {
      header: t('columns.status'),
      cell: (q) =>
        q.status === LISTING_QUESTION_STATUS.HIDDEN ? (
          <StatusBadge variant="neutral">{t('status.hidden')}</StatusBadge>
        ) : q.status === LISTING_QUESTION_STATUS.ANSWERED ? (
          <StatusBadge variant="success">{t('status.answered')}</StatusBadge>
        ) : (
          <StatusBadge variant="warning">{t('status.open')}</StatusBadge>
        ),
    },
    {
      header: t('columns.actions'),
      cell: (q) =>
        q.status === LISTING_QUESTION_STATUS.HIDDEN ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModerate(q.id, 'restore')}
            className={`px-3 py-1.5 text-sm rounded-lg border-default ${adminInteractive.rowHover}`}
          >
            {t('actions.restore')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModerate(q.id, 'hide')}
            className={`px-3 py-1.5 text-sm rounded-lg border-default ${adminInteractive.rowHover}`}
          >
            {t('actions.hide')}
          </Button>
        ),
    },
  ]

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

      {questions && questions.items.length === 0 ? (
        <div className="rounded-lg border border-default bg-surface-base p-8 text-center text-text-tertiary">{t('empty')}</div>
      ) : (
        <AdminTable columns={columns} rows={questions?.items ?? []} rowKey={(q) => q.id} />
      )}

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
