// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Requests tab
// ---------------------------------------------------------------------------

'use client'

import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import { Search, ExternalLink, Edit3, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ROUTES } from '@/config/routes'
import { formatDateShort } from '@/lib/date-formats'
import {
  DEVICE_CATEGORIES, URGENCY_LEVELS, REQUEST_STATUSES,
  getCategoryById, formatBudget,
} from '@/config/it-hilfe'
import { SWISS_CANTONS } from '@/config/swiss-cantons'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import type { RequestRow, PaginatedResponse, RequestFilter } from './types'
import { UrgencyBadge, RequestStatusBadge, CategoryIcon } from './shared'

interface RequestsTabProps {
  requests: PaginatedResponse<RequestRow> | null
  reqFilter: RequestFilter
  setReqFilter: React.Dispatch<React.SetStateAction<RequestFilter>>
  reqOffset: number
  setReqOffset: React.Dispatch<React.SetStateAction<number>>
  onEdit: (id: string, status: string, urgency: string, admin_notes: string | null) => void
}

export function RequestsTab({
  requests, reqFilter, setReqFilter, reqOffset, setReqOffset, onEdit,
}: RequestsTabProps) {
  const t = useTranslations('admin.itHilfe.requests')

  const columns: AdminTableColumn<RequestRow>[] = [
    {
      header: t('columns.title'),
      cell: (r) => (
        <a href={ROUTES.public.itHilfeRequest(r.id)} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary hover:text-action flex items-center gap-1">
          {r.title} <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ),
    },
    {
      header: t('columns.category'),
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <CategoryIcon categoryId={r.category_id} />
          <span className="text-text-secondary">{getCategoryById(r.category_id)?.name ?? r.category_id}</span>
        </div>
      ),
    },
    {
      header: t('columns.urgency'),
      cell: (r) => <UrgencyBadge urgency={r.urgency} />,
    },
    {
      header: t('columns.status'),
      cell: (r) => <RequestStatusBadge status={r.status} />,
    },
    {
      header: t('columns.creator'),
      cell: (r) => (
        <Link href={`/admin/users/${r.requester_id}`} className="text-action hover:underline text-sm">
          {r.requester_name || r.requester_email}
        </Link>
      ),
    },
    {
      header: t('columns.canton'),
      cell: (r) => <span className="text-text-tertiary">{r.canton}</span>,
    },
    {
      header: t('columns.budget'),
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-text-secondary">{formatBudget(r.budget_amount_cents, r.budget_type)}</span>,
    },
    {
      header: t('columns.offers'),
      align: 'center',
      cell: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${Number(r.offer_count) > 0 ? 'bg-action-muted text-action' : 'bg-surface-raised text-text-tertiary'}`}>
          {r.offer_count}
        </span>
      ),
    },
    {
      header: t('columns.date'),
      className: 'whitespace-nowrap',
      cell: (r) => <span className="text-text-tertiary">{formatDateShort(r.created_at)}</span>,
    },
    {
      header: t('columns.actions'),
      className: 'whitespace-nowrap',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(r.id, r.status, r.urgency, r.admin_notes)}
            className={`p-2 rounded-sm ${adminInteractive.rowHover}`}
            title={t('actions.edit')}
          >
            <Edit3 className="w-4 h-4 text-action" />
          </Button>
          <Link
            href={`/admin/tasks/new?source=it_hilfe&source_id=${r.id}&title=${encodeURIComponent(`IT-Hilfe: ${r.title}`)}&priority=${r.urgency === 'urgent' ? 'urgent' : 'normal'}`}
            className={`p-2 rounded-sm ${adminInteractive.rowHover}`}
            title={t('actions.createTask')}
          >
            <ClipboardList className="w-4 h-4 text-text-tertiary" />
          </Link>
        </div>
      ),
    },
  ]

  const rows = requests?.items ?? []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={reqFilter.status} onChange={e => { setReqFilter(f => ({ ...f, status: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allStatus')}</option>
          {REQUEST_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={reqFilter.category} onChange={e => { setReqFilter(f => ({ ...f, category: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allCategories')}</option>
          {DEVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={reqFilter.urgency} onChange={e => { setReqFilter(f => ({ ...f, urgency: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allUrgencies')}</option>
          {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select value={reqFilter.canton} onChange={e => { setReqFilter(f => ({ ...f, canton: e.target.value })); setReqOffset(0) }} className="w-auto">
          <option value="">{t('filters.allCantons')}</option>
          {SWISS_CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={reqFilter.search}
            onChange={e => { setReqFilter(f => ({ ...f, search: e.target.value })); setReqOffset(0) }}
            className="pl-9 pr-3"
          />
        </div>
      </div>

      {/* Table */}
      {rows.length > 0 ? (
        <AdminTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      ) : (
        <div className="bg-surface-base rounded-xl border border-default p-8 text-center text-text-tertiary">
          {t('empty')}
        </div>
      )}

      {requests && requests.pagination.total > 50 && (
        <Pagination
          offset={reqOffset}
          setOffset={setReqOffset}
          hasMore={requests.pagination.hasMore}
          countLabel={t('countLabel', { count: requests.pagination.total })}
        />
      )}
    </div>
  )
}

function Pagination({ offset, setOffset, hasMore, countLabel }: { offset: number; setOffset: React.Dispatch<React.SetStateAction<number>>; hasMore: boolean; countLabel: string }) {
  const tPag = useTranslations('admin.pagination')
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-tertiary">{countLabel}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
      </div>
    </div>
  )
}
