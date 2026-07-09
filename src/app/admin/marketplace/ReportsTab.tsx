'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatDateShort } from '@/lib/date-formats'
import { REPORT_REASONS } from '@/config/marketplace'
import { REPORT_STATUS, REPORT_STATUS_LABELS } from '@/config/report-status'
import type { ReportRow, PaginatedResponse } from './types'
import { StatusBadge } from '@/components/ui/status-badge'
import { adminInteractive } from '@/lib/admin-ui'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

function getReportReasonLabel(reason: string): string {
  return REPORT_REASONS.find(r => r.value === reason)?.label ?? reason
}

interface ReportsTabProps {
  reports: PaginatedResponse<ReportRow> | null
  filter: { status: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
  onHandle: (id: string) => void
}

export function ReportsTab({ reports, filter, setFilter, offset, setOffset, onHandle }: ReportsTabProps) {
  const t = useTranslations('admin.marketplace.reports')
  const tPag = useTranslations('admin.pagination')

  const columns: AdminTableColumn<ReportRow>[] = [
    {
      header: t('columns.listing'),
      cell: (r) => (
        <>
          <a href={`/marketplace/${r.listing_id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-action flex items-center gap-1">
            {r.listing_title} <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-text-tertiary">{t('sellerLabel', { name: r.seller_name || r.seller_email })}</p>
        </>
      ),
    },
    {
      header: t('columns.reason'),
      cell: (r) => (
        <>
          <span className="font-medium">{getReportReasonLabel(r.reason)}</span>
          {r.details && <p className="text-xs text-text-tertiary mt-1 max-w-xs truncate">{r.details}</p>}
        </>
      ),
    },
    {
      header: t('columns.reporter'),
      cell: (r) => <span className="text-text-secondary">{r.reporter_name || r.reporter_email}</span>,
    },
    {
      header: t('columns.date'),
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-text-tertiary">{formatDateShort(r.created_at)}</span>,
    },
    {
      header: t('columns.status'),
      cell: (r) =>
        r.status === REPORT_STATUS.PENDING ? (
          <StatusBadge variant="warning">{t('statusOpen')}</StatusBadge>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-secondary">{r.resolution_action ?? t('statusProcessed')}</span>
        ),
    },
    {
      header: t('columns.actions'),
      cell: (r) =>
        r.status === REPORT_STATUS.PENDING ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHandle(r.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border-default ${adminInteractive.rowHover}`}
          >
            {t('edit')}
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={filter.status} onChange={e => { setFilter({ status: e.target.value }); setOffset(0) }} className="w-auto">
          <option value={REPORT_STATUS.PENDING}>{REPORT_STATUS_LABELS[REPORT_STATUS.PENDING]}</option>
          <option value={REPORT_STATUS.REVIEWED}>{REPORT_STATUS_LABELS[REPORT_STATUS.REVIEWED]}</option>
          <option value="all">{t('filters.all')}</option>
        </Select>
      </div>

      <AdminTable columns={columns} rows={reports?.items ?? []} rowKey={(r) => r.id} />
      {reports && reports.items.length === 0 && (
        <div className="p-8 text-center text-text-tertiary">{t('empty')}</div>
      )}

      {reports && reports.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{t('countLabel', { count: reports.pagination.total })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
            <Button variant="outline" size="sm" disabled={!reports.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
