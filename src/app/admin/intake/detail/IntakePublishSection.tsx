'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, AlertCircle, ClipboardList } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { INTAKE_TIERS } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'
import Heading from '@/components/admin/AdminHeading'
import type { DetailData, ChecklistItemWithState } from '../types'

interface IntakePublishSectionProps {
  detail: DetailData
  qcGate: boolean
  openRequired: ChecklistItemWithState[]
  publishPrice: number
  setPublishPrice: (price: number) => void
  publishing: boolean
  onPublish: (options?: { skipQc?: boolean }) => void
}

export function IntakePublishSection({
  detail,
  qcGate,
  openRequired,
  publishPrice,
  setPublishPrice,
  publishing,
  onPublish,
}: IntakePublishSectionProps) {
  const t = useTranslations('admin.intake.detail')

  // Publish Section — refurbish-tier items (checklist-gated) and quick
  // captures of accessory categories (no QC required)
  if (!(!detail.checklist_complete && (detail.intake_tier === INTAKE_TIERS.REFURBISH || (detail.intake_tier === null && !qcGate)) && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED)) {
    return null
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${
      detail.checklist_complete
        ? 'border-strong bg-action-muted'
        : 'border bg-surface-raised'
    }`}>
      <Heading level={3} className="font-medium mb-3 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        {t('publishHeading')}
      </Heading>

      {!detail.checklist_complete && (
        <div className="flex items-start gap-2 mb-3 text-sm text-warning-700 dark:text-warning-200 bg-warning-50 dark:bg-warning-900/20 p-2 rounded-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {t('publishGate')}
            {openRequired.length > 0 && (
              <> {t('publishGateMissing', { items: openRequired.map(i => i.label).join(', ') })}</>
            )}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{t('sellingPriceLabel')}</label>
          <Input
            type="number"
            value={publishPrice || ''}
            onChange={(e) => setPublishPrice(Number(e.target.value))}
            min={0}
            className="w-32"
          />
        </div>
        <Button
          onClick={() => onPublish()}
          disabled={!detail.checklist_complete || publishing || publishPrice <= 0}
          variant="primary"
          size="sm"
        >
          {publishing ? t('publishing') : t('publishNow')}
        </Button>
        {/* Deliberate escape hatch: publish now, explicitly WITHOUT the
            Prüfsiegel (audited; blocked if a check actually failed). */}
        {!detail.checklist_failed && (
          <Button
            onClick={() => onPublish({ skipQc: true })}
            disabled={publishing || publishPrice <= 0}
            variant="outline"
            size="sm"
            title={t('publishUntestedTitle')}
          >
            {publishing ? t('publishing') : t('publishUntested')}
          </Button>
        )}
        {detail.checklist_complete && (
          <Link
            href={`${ROUTES.admin.intakeCapture}?edit=${detail.id}&returnTo=${encodeURIComponent(ROUTES.admin.intakeDetail(detail.id))}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border border-default text-text-secondary rounded-lg ${adminInteractive.rowHover} text-sm font-medium`}
            title={t('openFullErfassungTitle')}
          >
            <ClipboardList className="w-4 h-4" />
            {t('openFullErfassung')}
          </Link>
        )}
      </div>
    </div>
  )
}
