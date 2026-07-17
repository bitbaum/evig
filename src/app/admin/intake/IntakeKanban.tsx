'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Check, Clock3, Send, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getIntakeAgeDays,
  getIntakeStatus,
  INTAKE_STATUS,
  INTAKE_STUCK_AFTER_DAYS,
  type IntakeStatus,
} from '@/config/intake-status'
import {
  INTAKE_TIER_ICONS,
  INTAKE_TIER_LABELS,
  QUICK_CAPTURE_ICON,
  QUICK_CAPTURE_LABEL,
} from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { LISTING_STATUS } from '@/config/marketplace'
import { ROUTES } from '@/config/routes'
import { formatDateShort } from '@/lib/date-formats'
import type { PipelineItem } from './types'

interface StatusCounts {
  inProgress: number
  failed: number
  ready: number
  published: number
}

interface IntakeKanbanProps {
  items: PipelineItem[]
  counts: StatusCounts
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onOpenDetail: (id: string) => void
}

const COLUMNS: Array<{
  status: IntakeStatus
  countKey: keyof StatusCounts
  icon: typeof Clock3
  surface: string
  accent: string
}> = [
  {
    status: INTAKE_STATUS.IN_PROGRESS,
    countKey: 'inProgress',
    icon: Clock3,
    surface: 'border-warning-200 dark:border-warning-800',
    accent: 'text-warning-700 dark:text-warning-300',
  },
  {
    status: INTAKE_STATUS.FAILED,
    countKey: 'failed',
    icon: AlertTriangle,
    surface: 'border-error-200 dark:border-error-800',
    accent: 'text-error-700 dark:text-error-300',
  },
  {
    status: INTAKE_STATUS.READY,
    countKey: 'ready',
    icon: Send,
    surface: 'border-strong',
    accent: 'text-action',
  },
  {
    status: INTAKE_STATUS.PUBLISHED,
    countKey: 'published',
    icon: Check,
    surface: 'border-subtle',
    accent: 'text-action',
  },
]

/**
 * SSOT label for a published device's LIVE listing state (shared by the
 * desktop kanban card and the mobile pipeline card).
 */
export function listingStateLabel(
  t: ReturnType<typeof useTranslations<'admin.intake.pipeline'>>,
  listingStatus: string | null,
): string {
  return listingStatus === LISTING_STATUS.ACTIVE ? t('board.listingState.active')
    : listingStatus === LISTING_STATUS.SOLD ? t('board.listingState.sold')
    : listingStatus === LISTING_STATUS.RESERVED ? t('board.listingState.reserved')
    : listingStatus === LISTING_STATUS.DRAFT ? t('board.listingState.draft')
    : listingStatus === LISTING_STATUS.REMOVED ? t('board.listingState.removed')
    : t('board.listingMissing')
}

/** Desktop workshop board. Cards are oldest-first inside every station. */
export function IntakeKanban({
  items,
  counts,
  statusFilter,
  onStatusFilterChange,
  onOpenDetail,
}: IntakeKanbanProps) {
  const t = useTranslations('admin.intake.pipeline')
  const visibleColumns = statusFilter
    ? COLUMNS.filter((column) => column.status === statusFilter)
    : COLUMNS

  const grouped = new Map<IntakeStatus, PipelineItem[]>()
  for (const column of COLUMNS) grouped.set(column.status, [])
  for (const item of items) grouped.get(getIntakeStatus(item))?.push(item)
  for (const columnItems of grouped.values()) {
    columnItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  return (
    <div className={`hidden gap-3 md:grid ${visibleColumns.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
      {visibleColumns.map((column) => {
        const Icon = column.icon
        const columnItems = grouped.get(column.status) ?? []
        return (
          <section key={column.status} className={`min-w-0 rounded-xl border bg-surface-raised ${column.surface}`}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onStatusFilterChange(statusFilter === column.status ? '' : column.status)}
              className="flex h-auto w-full items-center gap-2 rounded-b-none border-b border-subtle px-3 py-3 text-left"
              aria-pressed={statusFilter === column.status}
            >
              <Icon className={`h-4 w-4 shrink-0 ${column.accent}`} aria-hidden="true" />
              <span className="flex-1 text-sm font-semibold text-text-primary">
                {t(`board.${column.status}`)}
              </span>
              <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                {counts[column.countKey]}
              </span>
            </Button>

            {/* "Im Shop" is not an archive — it IS the shop. Jump straight
                to the listings admin where these live. */}
            {column.status === INTAKE_STATUS.PUBLISHED && (
              <Link
                href={ROUTES.admin.marketplace}
                className="flex items-center justify-between border-b border-subtle px-3 py-2 text-xs font-medium text-action hover:underline"
              >
                {t('board.manageListings')}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            )}
            <div className="space-y-2 p-2">
              {columnItems.length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-text-muted">{t('board.empty')}</p>
              ) : columnItems.map((item) => (
                <KanbanCard key={item.id} item={item} onOpen={() => onOpenDetail(item.id)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function KanbanCard({ item, onOpen }: { item: PipelineItem; onOpen: () => void }) {
  const t = useTranslations('admin.intake.pipeline')
  const status = getIntakeStatus(item)
  const ageDays = getIntakeAgeDays(item.created_at)
  const needsAgeWarning = status !== INTAKE_STATUS.PUBLISHED && ageDays >= INTAKE_STUCK_AFTER_DAYS
  const category = KATEGORIEN.find((entry) => entry.value === item.category)?.label

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onOpen}
      className="h-auto min-h-11 w-full flex-col items-stretch rounded-lg border border-subtle bg-surface-base p-3 text-left shadow-sm hover:border-strong hover:bg-surface-base"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-primary">
            {item.brand} {item.product_name}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-text-tertiary">{item.item_uuid}</span>
        </span>
        {needsAgeWarning && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800 dark:bg-warning-900/30 dark:text-warning-200">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {t('board.ageDays', { count: ageDays })}
          </span>
        )}
      </span>

      <span className="mt-3 flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="truncate">
          {item.intake_tier
            ? `${INTAKE_TIER_ICONS[item.intake_tier]} ${INTAKE_TIER_LABELS[item.intake_tier]}`
            : `${QUICK_CAPTURE_ICON} ${QUICK_CAPTURE_LABEL}`}
        </span>
        <span className="shrink-0 text-text-muted">{formatDateShort(item.created_at)}</span>
      </span>

      <span className="mt-1 block truncate text-xs text-text-tertiary">{category || t('board.noCategory')}</span>

      {/* SSOT: the shop state comes from the LISTING, not from the intake
          record's claim — sold/removed/missing listings surface here. */}
      {status === INTAKE_STATUS.PUBLISHED && (
        <span className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          item.listing_status === LISTING_STATUS.ACTIVE
            ? 'bg-action-muted text-action'
            : item.listing_status
              ? 'bg-surface-overlay text-text-secondary'
              : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200'
        }`}>
          {listingStateLabel(t, item.listing_status)}
        </span>
      )}

      {item.intake_tier && status !== INTAKE_STATUS.PUBLISHED && (
        <span className="mt-3 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-overlay">
            <span
              className={`block h-full rounded-full ${
                status === INTAKE_STATUS.FAILED ? 'bg-error-500' :
                item.checklist_progress.percentage === 100 ? 'bg-action' : 'bg-warning-500'
              }`}
              style={{ width: `${item.checklist_progress.percentage}%` }}
            />
          </span>
          <span className="text-xs tabular-nums text-text-tertiary">
            {item.checklist_progress.requiredCompleted}/{item.checklist_progress.requiredTotal}
          </span>
        </span>
      )}
    </Button>
  )
}
