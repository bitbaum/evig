'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, ShieldCheck, Eye, Edit3, Trash2 } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatPrice } from '@/config/marketplace'
import { getCategoryLabel, LISTING_STATUS, LISTING_STATUS_CONFIG, MARKETPLACE_SELLER_TYPE } from '@/config/marketplace'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { getConditionLabel } from '@/config/erfassung/conditions'
import { VerifyActions } from './VerifyActions'
import { StatusBadge } from './StatusBadge'
import type { ListingRow, PaginatedResponse } from './types'
import { adminInteractive } from '@/lib/admin-ui'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

interface ListingsTabProps {
  listings: PaginatedResponse<ListingRow> | null
  filter: { status: string; category: string; seller_type: string; verified: string; reported: string; search: string }
  setFilter: React.Dispatch<React.SetStateAction<{ status: string; category: string; seller_type: string; verified: string; reported: string; search: string }>>
  offset: number
  setOffset: React.Dispatch<React.SetStateAction<number>>
  onEdit: (id: string, admin_notes: string, status: string) => void
  onRemove: (id: string, title: string) => void
  /** Refetch listings after a verify/unverify (client-held state). */
  onChanged: () => void
}

export function ListingsTab({ listings, filter, setFilter, offset, setOffset, onEdit, onRemove, onChanged }: ListingsTabProps) {
  const t = useTranslations('admin.marketplace.listings')
  const tPag = useTranslations('admin.pagination')

  const columns: AdminTableColumn<ListingRow>[] = [
    {
      header: t('columns.title'),
      cell: (l) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-text-primary">{l.title}</span>
          {l.verified_at && <ShieldCheck className="w-3.5 h-3.5 text-action" />}
          {l.is_revampit && <span className="px-1.5 py-0.5 text-[10px] rounded-sm bg-action-muted text-action">{t('badges.rit')}</span>}
          {parseInt(l.report_count) > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-sm bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300">
              {t('badges.reportCount', { count: parseInt(l.report_count) })}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('columns.category'),
      cell: (l) => (
        <span className="text-text-secondary">
          {getCategoryLabel(l.category)}
          {l.condition && <span className="text-xs ml-1">· {getConditionLabel(l.condition)}</span>}
        </span>
      ),
    },
    {
      header: t('columns.price'),
      cell: (l) => <span className="text-text-primary font-medium">{formatPrice(Number(l.price_chf))}</span>,
    },
    {
      header: t('columns.seller'),
      cell: (l) => (
        <Link href={`/admin/users/${l.seller_id}`} className="text-action hover:underline text-sm">
          {l.seller_name || l.seller_email}
        </Link>
      ),
    },
    {
      header: t('columns.status'),
      cell: (l) => <StatusBadge status={l.status} config={LISTING_STATUS_CONFIG} />,
    },
    {
      header: t('columns.date'),
      className: 'whitespace-nowrap',
      cell: (l) => <span className="text-text-tertiary">{formatDateShort(l.created_at)}</span>,
    },
    {
      header: t('columns.actions'),
      cell: (l) => (
        <div className="flex items-center gap-1">
          <a href={`/marketplace/${l.id}`} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-sm ${adminInteractive.rowHover}`} title={t('actions.view')}>
            <Eye className="w-4 h-4 text-text-tertiary" />
          </a>
          <Button variant="ghost" size="icon" onClick={() => onEdit(l.id, l.admin_notes || '', l.status)} className={`p-2 rounded-sm ${adminInteractive.rowHover}`} title={t('actions.edit')}>
            <Edit3 className="w-4 h-4 text-text-tertiary" />
          </Button>
          <VerifyActions listingId={l.id} isVerified={!!l.verified_at} title={l.title} onChanged={onChanged} />
          {l.status !== LISTING_STATUS.REMOVED && (
            <Button variant="destructive-ghost" size="icon" onClick={() => onRemove(l.id, l.title)} className={`p-2 rounded-sm ${adminInteractive.rowHover}`} title={t('actions.remove')}>
              <Trash2 className="w-4 h-4 text-error-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allStatus')}</option>
          {Object.entries(LISTING_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select value={filter.category} onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setOffset(0) }} className="w-auto">
          <option value="">{t('filters.allCategories')}</option>
          {KATEGORIEN.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
        <Select value={filter.seller_type} onChange={e => { setFilter(f => ({ ...f, seller_type: e.target.value })); setOffset(0) }} className="w-auto">
          <option value="all">{t('filters.allSellers')}</option>
          <option value={MARKETPLACE_SELLER_TYPE.REVAMPIT}>{t('filters.revampit')}</option>
          <option value={MARKETPLACE_SELLER_TYPE.COMMUNITY}>{t('filters.community')}</option>
        </Select>
        <Select value={filter.verified} onChange={e => { setFilter(f => ({ ...f, verified: e.target.value })); setOffset(0) }} className="w-auto">
          <option value="all">{t('filters.verification')}</option>
          <option value="yes">{t('filters.verified')}</option>
          <option value="no">{t('filters.unverified')}</option>
        </Select>
        <Select value={filter.reported} onChange={e => { setFilter(f => ({ ...f, reported: e.target.value })); setOffset(0) }} className="w-auto">
          <option value="all">{t('filters.reports')}</option>
          <option value="yes">{t('filters.reported')}</option>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={filter.search}
            onChange={e => { setFilter(f => ({ ...f, search: e.target.value })); setOffset(0) }}
            className="pl-9 pr-3"
          />
        </div>
      </div>

      {/* Table */}
      {listings && listings.items.length === 0 ? (
        <div className="rounded-xl border border-default bg-surface-base p-8 text-center text-text-tertiary">{t('empty')}</div>
      ) : (
        <AdminTable columns={columns} rows={listings?.items ?? []} rowKey={(l) => l.id} />
      )}

      {/* Pagination */}
      {listings && listings.pagination.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-tertiary">{t('countLabel', { count: listings.pagination.total })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - 50))}>{tPag('prev')}</Button>
            <Button variant="outline" size="sm" disabled={!listings.pagination.hasMore} onClick={() => setOffset(o => o + 50)}>{tPag('next')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
