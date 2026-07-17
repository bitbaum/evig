'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Package, Printer, Plus, PackageCheck, QrCode, Store, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { apiFetch } from '@/lib/api/client'
import { QC_SKIP_ONE_CLICK_NOTE } from '@/config/intake-checklist'

interface SuccessScreenProps {
  itemUUID: string
  productId: string
  inventoryId: string | null
  /** What actually happened — determines the headline and the destinations. */
  action: 'draft' | 'erfassen' | 'publish'
  /** Live marketplace listing (publish only). */
  listingId: string | null
  /** Direct-publish was intercepted by the QC gate — device is in the pipeline. */
  qcRequired: boolean
  /** Captured selling price — enables the one-click untested publish. */
  sellingPriceChf?: number | null
  onReset: () => void
}

/**
 * The moment after capturing a device must answer, without ambiguity:
 * what happened, where the device is NOW, and what to do next. The old
 * screen said "erfasst!" and linked to an overview that did not contain
 * the device — the classic "erfasst, aber wo?" dead end.
 */
export function SuccessScreen({ itemUUID, productId, inventoryId, action, listingId, qcRequired, sellingPriceChf, onReset }: SuccessScreenProps) {
  const t = useTranslations('components.erfassung.successScreen')

  // One-click "publish without QC" straight from the success screen — the
  // deliberate escape hatch when testing is not wanted. Audited; the listing
  // carries no Prüfsiegel.
  const [skipBusy, setSkipBusy] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)
  const [skippedListingId, setSkippedListingId] = useState<string | null>(null)
  const publishUntested = async () => {
    if (!inventoryId || skipBusy) return
    setSkipBusy(true)
    setSkipError(null)
    try {
      const result = await apiFetch<{ listing_id: string | null }>(`/api/admin/intake/${inventoryId}/publish`, {
        method: 'POST',
        body: {
          price_chf: Number(sellingPriceChf) || 0,
          qc_skip: true,
          qc_skip_reason: QC_SKIP_ONE_CLICK_NOTE,
        },
      })
      if (result.success) {
        setSkippedListingId(result.data?.listing_id ?? null)
      } else {
        setSkipError(result.error || null)
      }
    } finally {
      setSkipBusy(false)
    }
  }
  const untestedPublished = skippedListingId !== null

  const titles = {
    draft: t('titleDraft'),
    erfassen: t('title'),
    publish: t('titlePublished'),
  } as const
  const whereabouts = {
    draft: t('whereDraft'),
    erfassen: t('whereErfassen'),
    publish: t('wherePublished'),
  } as const
  // QC gate intercepted the publish: the device is NOT live — it sits in the
  // pipeline with a checklist. Saying "publiziert!" here would be a lie.
  const title = untestedPublished ? t('titlePublished') : qcRequired ? t('titleQcGated') : titles[action]
  const whereabout = untestedPublished ? t('whereUntested') : qcRequired ? t('whereQcGated') : whereabouts[action]

  const deviceHref = inventoryId
    ? `${ROUTES.admin.intake}?detail=${inventoryId}`
    : ROUTES.admin.intake

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-action" />
        </div>
        <Heading level={2} className="text-2xl font-bold text-text-primary mb-2">
          {title}
        </Heading>
        <p className="text-text-secondary mb-2">
          {t('itemUUIDLabel')} <code className="bg-surface-raised px-2 py-1 rounded-sm">{itemUUID}</code>
        </p>
        <p className="text-sm text-text-secondary mb-6">{whereabout}</p>

        {skipError && (
          <p className="mb-4 rounded-lg border border-error-300 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-300">
            {skipError}
          </p>
        )}

        {/* Action buttons — primary action depends on where the device went */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          {untestedPublished && skippedListingId ? (
            <Button as={Link} href={ROUTES.public.marketplaceListing(skippedListingId)} variant="primary">
              <Store className="w-5 h-5" />
              {t('viewInShop')}
            </Button>
          ) : action === 'publish' && listingId ? (
            <Button as={Link} href={ROUTES.public.marketplaceListing(listingId)} variant="primary">
              <Store className="w-5 h-5" />
              {t('viewInShop')}
            </Button>
          ) : (
            <Button as={Link} href={deviceHref} variant="primary">
              <PackageCheck className="w-5 h-5" />
              {t('toDevice')}
            </Button>
          )}
          {qcRequired && !untestedPublished && inventoryId && (
            <Button
              type="button"
              onClick={publishUntested}
              disabled={skipBusy || !(Number(sellingPriceChf) > 0)}
              variant="outline"
              title={Number(sellingPriceChf) > 0 ? t('publishUntestedTitle') : t('publishUntestedNoPrice')}
            >
              {skipBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
              {t('publishUntested')}
            </Button>
          )}
          <Button type="button" onClick={onReset} variant="secondary">
            <Plus className="w-5 h-5" />
            {t('captureAnother')}
          </Button>
          {inventoryId && (
            <Button as={Link} href={ROUTES.admin.intakeLabel(inventoryId)} variant="outline">
              <QrCode className="w-5 h-5" />
              {t('printLabel')}
            </Button>
          )}
          <Button as={Link} href={ROUTES.admin.erfassungFactsheet(productId)} variant="outline">
            <Printer className="w-5 h-5" />
            {t('printFactsheet')}
          </Button>
        </div>
      </div>
    </div>
  )
}
