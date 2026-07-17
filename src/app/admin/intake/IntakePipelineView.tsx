'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus, Search, Filter, Check, Package, Wrench, Send, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type IntakePipelineTranslator = ReturnType<typeof useTranslations>
import {
  getIntakeTierOptions,
  QUICK_CAPTURE_TIER,
  QUICK_CAPTURE_LABEL,
  QUICK_CAPTURE_ICON,
} from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { INTAKE_STATUS, INTAKE_STATUS_LABELS } from '@/config/intake-status'
import { Pagination } from '@/components/ui/Pagination'
import type { PipelineItem } from './types'
import { IntakePipelineCards } from './IntakePipelineCards'
import { IntakeKanban } from './IntakeKanban'
import { AdminHeroStatus, type HeroTone, type HeroKpi, type HeroCta } from '@/components/admin/AdminHeroStatus'
import { ROUTES } from '@/config/routes'

interface IntakePipelineViewProps {
  items: PipelineItem[]
  loading: boolean
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  statusCounts: { inProgress: number; failed: number; ready: number; published: number; total: number }
  tierFilter: string
  statusFilter: string
  categoryFilter: string
  searchFilter: string
  onTierFilterChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
  onSearchFilterChange: (v: string) => void
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
  onOpenDetail,
  onPageChange,
}: IntakePipelineViewProps) {
  const t = useTranslations('admin.intake.pipeline')
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => { rootRef.current?.setAttribute('data-intake-ready', 'true') }, [])
  return (
    <div ref={rootRef} className="space-y-4" data-intake-ready="false">
      {/* Until counts arrive the hero would confidently claim "Pipeline ist
          leer" on every page load — render a quiet placeholder instead. */}
      {loading && statusCounts.total === 0 ? (
        <div className="h-28 animate-pulse rounded-lg border border-subtle bg-surface-raised" aria-hidden="true" />
      ) : (
        <IntakeHero statusCounts={statusCounts} onStatusFilter={onStatusFilterChange} t={t} />
      )}

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button href={ROUTES.admin.intakeCapture} target="_self" variant="primary" size="sm">
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

      {/* Stage board */}
      {loading ? (
        <div className="text-center py-8 text-text-tertiary">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-raised rounded-lg">
          <Package className="w-12 h-12 mx-auto text-text-muted mb-3" />
          <p className="text-text-tertiary mb-2">{t('empty')}</p>
          <Button
            href={ROUTES.admin.intakeCapture}
            target="_self"
            variant="ghost"
            size="sm"
            className="text-action hover:underline text-sm"
          >
            {t('createFirst')}
          </Button>
        </div>
      ) : (
        <>
          {/* Phone: card list (whole card tappable, 44px+ targets) */}
          <div className="md:hidden">
            <IntakePipelineCards items={items} onOpenDetail={onOpenDetail} />
          </div>

          <IntakeKanban
            items={items}
            counts={statusCounts}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            onOpenDetail={onOpenDetail}
          />

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
// Severity ladder: failed-QC > ready-to-publish > in-progress > empty > healthy.
// Why "failed" beats everything: a failed required test means a device is
// blocked until someone decides (fix & retest, or re-tier) — pure dead
// stock until then. "Ready" beats "inProgress": work-in-progress is doing
// fine on its own; ready means finished but stuck in the pipeline.
// ─────────────────────────────────────────────────────────────────────────────

interface IntakeStatusCounts {
  inProgress: number
  failed: number
  ready: number
  published: number
  total: number
}

export function deriveIntakeHeroState(
  counts: IntakeStatusCounts,
  onStatusFilter: (v: string) => void,
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
    { label: t('hero.kpis.failed'), value: counts.failed },
    { label: t('hero.kpis.ready'), value: counts.ready },
    { label: t('hero.kpis.published'), value: counts.published },
  ]

  if (counts.failed > 0) {
    return {
      tone: 'urgent',
      icon: AlertTriangle,
      headline: t('hero.failed.headline', { count: counts.failed }),
      sub: t('hero.failed.sub'),
      cta: {
        label: t('hero.failed.cta'),
        onClick: () => onStatusFilter(INTAKE_STATUS.FAILED),
      },
      kpis,
    }
  }
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
  t,
}: {
  statusCounts: IntakeStatusCounts
  onStatusFilter: (v: string) => void
  t: IntakePipelineTranslator
}) {
  const s = deriveIntakeHeroState(statusCounts, onStatusFilter, t)
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
