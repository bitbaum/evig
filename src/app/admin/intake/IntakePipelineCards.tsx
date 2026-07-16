'use client'

/**
 * Mobile card list for the intake pipeline (< md). Phone-in-hand workshop
 * use: one device per card, whole card tappable, ≥44px touch target.
 * The desktop table stays in IntakePipelineView.
 */

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminInteractive } from '@/lib/admin-ui'
import {
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  QUICK_CAPTURE_LABEL,
  QUICK_CAPTURE_ICON,
} from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { INTAKE_STATUS } from '@/config/intake-status'
import { formatDateShort } from '@/lib/date-formats'
import { StatusBadge } from '@/components/ui/status-badge'
import type { PipelineItem } from './types'

interface IntakePipelineCardsProps {
  items: PipelineItem[]
  onOpenDetail: (id: string) => void
}

export function IntakePipelineCards({ items, onOpenDetail }: IntakePipelineCardsProps) {
  const t = useTranslations('admin.intake.pipeline')

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const progress = item.checklist_progress
        return (
          <li key={item.id}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenDetail(item.id)}
              className={`w-full min-h-11 h-auto flex-col items-stretch text-left bg-surface-base border rounded-lg p-3 ${adminInteractive.rowHover} transition-colors`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-text-primary truncate">
                    {item.brand} {item.product_name}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    <span className="font-mono">{item.item_uuid}</span>
                    {' · '}
                    {KATEGORIEN.find(k => k.value === item.category)?.label || '—'}
                  </div>
                </div>
                {item.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-action-muted text-action shrink-0">
                    <Check className="w-3 h-3" /> {t('status.published')}
                  </span>
                ) : item.checklist_failed ? (
                  <StatusBadge variant="error" className="shrink-0">{t('status.failed')}</StatusBadge>
                ) : item.checklist_complete ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-action-muted text-action shrink-0">
                    {t('status.ready')}
                  </span>
                ) : (
                  <StatusBadge variant="warning" className="shrink-0">{t('status.inProgress')}</StatusBadge>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 mt-2.5">
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary shrink-0">
                  {item.intake_tier
                    ? <>{INTAKE_TIER_ICONS[item.intake_tier]} {INTAKE_TIER_LABELS[item.intake_tier]}</>
                    : <>{QUICK_CAPTURE_ICON} {QUICK_CAPTURE_LABEL}</>}
                </span>
                {item.intake_tier ? (
                  <span className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="w-16 h-2 bg-surface-overlay rounded-full overflow-hidden">
                      <span
                        className={`block h-full rounded-full ${
                          item.checklist_failed ? 'bg-error-500' :
                          progress.percentage === 100 ? 'bg-action' :
                          progress.percentage > 50 ? 'bg-warning-500' : 'bg-error-400'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </span>
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {progress.requiredCompleted}/{progress.requiredTotal}
                    </span>
                  </span>
                ) : null}
                <span className="text-xs text-text-muted shrink-0">{formatDateShort(item.created_at)}</span>
              </div>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
