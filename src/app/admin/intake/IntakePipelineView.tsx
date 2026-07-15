'use client'

import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import {
  Plus, Search, Filter, Check, Package, Wrench, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type IntakePipelineTranslator = ReturnType<typeof useTranslations>
import {
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  getIntakeTierOptions,
  QUICK_CAPTURE_TIER,
  QUICK_CAPTURE_LABEL,
  QUICK_CAPTURE_ICON,
} from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { INTAKE_STATUS, INTAKE_STATUS_LABELS } from '@/config/intake-status'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateShort } from '@/lib/date-formats'
import type { PipelineItem } from './types'
import { StatusBadge } from '@/components/ui/status-badge'
import { AdminHeroStatus, type HeroTone, type HeroKpi, type HeroCta } from '@/components/admin/AdminHeroStatus'

interface IntakePipelineViewProps {
  items: PipelineItem[]
  loading: boolean
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  statusCounts: { inProgress: number; ready: number; published: number; total: number }
  tierFilter: string
  statusFilter: string
  categoryFilter: string
  searchFilter: string
  onTierFilterChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
  onSearchFilterChange: (v: string) => void
  onCreateNew: () => void
  onOpenDetail: (id: string) => void
  onPageChange: (offset: number) => void
}

export function IntakePipelineView({
  items,
  loading,
  pagination,
  statusCounts,
  tierFilter,
  statusFilter,
  categoryFilter,
  searchFilter,
  onTierFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSearchFilterChange,
  onCreateNew,
  onOpenDetail,
  onPageChange,
}: IntakePipelineViewProps) {
  const t = useTranslations('admin.intake.pipeline')
  return (
    <div className="space-y-4">
      <IntakeHero statusCounts={statusCounts} onStatusFilter={onStatusFilterChange} onCreateNew={onCreateNew} t={t} />

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={onCreateNew} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> {t('newDevice')}
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-4 h-4 text-text-muted" />
        </div>

        <Select
          value={tierFilter}
          onChange={(e) => onTierFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">{t('filters.allTiers')}</option>
          {getIntakeTierOptions().map(o => (
            <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
          ))}
          <option value={QUICK_CAPTURE_TIER}>{QUICK_CAPTURE_ICON} {QUICK_CAPTURE_LABEL}</option>
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">{t('filters.allStatus')}</option>
          {Object.values(INTAKE_STATUS).map(status => (
            <option key={status} value={status}>{INTAKE_STATUS_LABELS[status]}</option>
          ))}
        </Select>

        <Select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="w-auto"
        >
          <option value="">{t('filters.allCategories')}</option>
          {KATEGORIEN.map(k => (
            <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
          ))}
        </Select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
            className="pl-8 pr-3 w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-text-tertiary">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised rounded-lg">
          <Package className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <p className="text-text-tertiary mb-2">{t('empty')}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNew}
            className="text-action hover:underline text-sm"
          >
            {t('createFirst')}
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-tertiary">
                  <th className="pb-2 font-medium">{t('columns.uuid')}</th>
                  <th className="pb-2 font-medium">{t('columns.device')}</th>
                  <th className="pb-2 font-medium">{t('columns.tier')}</th>
                  <th className="pb-2 font-medium">{t('columns.checklist')}</th>
                  <th className="pb-2 font-medium">{t('columns.status')}</th>
                  <th className="pb-2 font-medium">{t('columns.donation')}</th>
                  <th className="pb-2 font-medium">{t('columns.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => {
                  const progress = item.checklist_progress
                  return (
                    <tr
                      key={item.id}
                      className={`${adminInteractive.rowHover} cursor-pointer`}
                      onClick={() => onOpenDetail(item.id)}
                    >
                      <td className="py-2.5 font-mono text-xs text-text-tertiary">{item.item_uuid}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{item.brand} {item.product_name}</div>
                        <div className="text-xs text-text-tertiary">
                          {KATEGORIEN.find(k => k.value === item.category)?.label || '-'}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {item.intake_tier
                            ? <>{INTAKE_TIER_ICONS[item.intake_tier]} {INTAKE_TIER_LABELS[item.intake_tier]}</>
                            : <>{QUICK_CAPTURE_ICON} {QUICK_CAPTURE_LABEL}</>}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {item.intake_tier ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-surface-overlay rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  progress.percentage === 100 ? 'bg-action' :
                                  progress.percentage > 50 ? 'bg-warning-500' : 'bg-error-400'
                                }`}
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-tertiary">
                              {progress.requiredCompleted}/{progress.requiredTotal}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-action-muted text-action">
                            <Check className="w-3 h-3" /> {t('status.published')}
                          </span>
                        ) : item.checklist_complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-action-muted text-action">
                            {t('status.ready')}
                          </span>
                        ) : (
                          <StatusBadge variant="warning">{t('status.inProgress')}</StatusBadge>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.source_donation_id ? (
                          <span className="text-xs text-action">{item.donor_name || t('donationYes')}</span>
                        ) : (
                          <span className="text-xs text-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-text-tertiary">
                        {formatDateShort(item.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page: number) => onPageChange((page - 1) * pagination.limit)}
          />
        </>
      )}
    </div>
  )
}

// ─── IntakeHero ─────────────────────────────────────────────────────────────
// Severity ladder: ready-to-publish > in-progress > empty > healthy.
// Why "ready" beats "inProgress": work-in-progress is doing fine on its
// own. "Ready" means a device is finished but stuck in the pipeline —
// the admin's bottleneck to clear.
// ─────────────────────────────────────────────────────────────────────────────

interface IntakeStatusCounts {
  inProgress: number
  ready: number
  published: number
  total: number
}

export function deriveIntakeHeroState(
  counts: IntakeStatusCounts,
  onStatusFilter: (v: string) => void,
  onCreateNew: () => void,
  t: IntakePipelineTranslator,
): {
  tone: HeroTone
  icon: typeof Package
  headline: string
  sub: string
  cta?: HeroCta
  kpis: HeroKpi[]
} {
  const kpis: HeroKpi[] = [
    { label: t('hero.kpis.total'), value: counts.total },
    { label: t('hero.kpis.inProgress'), value: counts.inProgress },
    { label: t('hero.kpis.ready'), value: counts.ready },
    { label: t('hero.kpis.published'), value: counts.published },
  ]

  if (counts.ready > 0) {
    return {
      tone: 'attention',
      icon: Send,
      headline: t('hero.ready.headline', { count: counts.ready }),
      sub: t('hero.ready.sub'),
      cta: {
        label: t('hero.ready.cta'),
        onClick: () => onStatusFilter(INTAKE_STATUS.READY),
      },
      kpis,
    }
  }
  if (counts.inProgress > 0) {
    return {
      tone: 'attention',
      icon: Wrench,
      headline: t('hero.inProgress.headline', { count: counts.inProgress }),
      sub: t('hero.inProgress.sub'),
      cta: {
        label: t('hero.inProgress.cta'),
        onClick: () => onStatusFilter(INTAKE_STATUS.IN_PROGRESS),
      },
      kpis,
    }
  }
  if (counts.total === 0) {
    return {
      tone: 'empty',
      icon: Package,
      headline: t('hero.empty.headline'),
      sub: t('hero.empty.sub'),
      cta: { label: t('hero.empty.cta'), onClick: onCreateNew },
      kpis,
    }
  }
  return {
    tone: 'healthy',
    icon: Check,
    headline: t('hero.healthy.headline'),
    sub: t('hero.healthy.sub', { published: counts.published }),
    kpis,
  }
}

function IntakeHero({
  statusCounts,
  onStatusFilter,
  onCreateNew,
  t,
}: {
  statusCounts: IntakeStatusCounts
  onStatusFilter: (v: string) => void
  onCreateNew: () => void
  t: IntakePipelineTranslator
}) {
  const s = deriveIntakeHeroState(statusCounts, onStatusFilter, onCreateNew, t)
  return (
    <AdminHeroStatus
      tone={s.tone}
      icon={s.icon}
      headline={s.headline}
      sub={s.sub}
      cta={s.cta}
      kpis={s.kpis}
    />
  )
}
