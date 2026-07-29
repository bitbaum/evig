'use client'

import { useTranslations } from 'next-intl'
import { Image as ImageIcon } from 'lucide-react'
import { KATEGORIEN, getConditionLabel } from '@/config/erfassung'
import { formatDateShort } from '@/lib/date-formats'
import type { DetailData } from '../types'

interface IntakeDeviceSummaryProps {
  detail: DetailData
}

export function IntakeDeviceSummary({ detail }: IntakeDeviceSummaryProps) {
  const t = useTranslations('admin.intake.detail')
  return (
    <div className="bg-surface-base border rounded-lg p-4">
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-subtle bg-surface-raised">
          {detail.image_url ? (

            <img src={detail.image_url} alt={`${detail.brand} ${detail.product_name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-8 w-8 text-text-muted" aria-hidden="true" />
            </div>
          )}
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-tertiary">{t('device.condition')}</dt>
            <dd className="font-medium text-text-primary">{getConditionLabel(detail.condition)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary">{t('device.category')}</dt>
            <dd className="font-medium text-text-primary">
              {KATEGORIEN.find(k => k.value === detail.category)?.label || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-tertiary">{t('device.price')}</dt>
            <dd className="font-medium text-text-primary tabular-nums">
              {detail.selling_price_chf != null ? `CHF ${Number(detail.selling_price_chf).toFixed(2)}` : '—'}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-xs text-text-tertiary">{t('device.captured')}</dt>
            <dd className="text-text-secondary">
              {formatDateShort(detail.created_at)}
              {detail.created_by_name ? ` · ${detail.created_by_name}` : ''}
            </dd>
          </div>
        </dl>
      </div>
      {detail.short_description && (
        <p className="mt-3 border-t border-subtle pt-3 text-sm text-text-secondary">
          {detail.short_description}
        </p>
      )}
    </div>
  )
}
