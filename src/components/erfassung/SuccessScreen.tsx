'use client'

import { Link } from '@/i18n/navigation'
import { Package, Printer, Plus, PackageCheck, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

interface SuccessScreenProps {
  itemUUID: string
  productId: string
  inventoryId: string | null
  /** What actually happened — determines the headline and the destinations. */
  action: 'draft' | 'erfassen' | 'publish'
  /** Live marketplace listing (publish only). */
  listingId: string | null
  onReset: () => void
}

/**
 * The moment after capturing a device must answer, without ambiguity:
 * what happened, where the device is NOW, and what to do next. The old
 * screen said "erfasst!" and linked to an overview that did not contain
 * the device — the classic "erfasst, aber wo?" dead end.
 */
export function SuccessScreen({ itemUUID, productId, inventoryId, action, listingId, onReset }: SuccessScreenProps) {
  const t = useTranslations('components.erfassung.successScreen')

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
          {titles[action]}
        </Heading>
        <p className="text-text-secondary mb-2">
          {t('itemUUIDLabel')} <code className="bg-surface-raised px-2 py-1 rounded-sm">{itemUUID}</code>
        </p>
        <p className="text-sm text-text-secondary mb-6">{whereabouts[action]}</p>

        {/* Action buttons — primary action depends on where the device went */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          {action === 'publish' && listingId ? (
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
          <Button type="button" onClick={onReset} variant="secondary">
            <Plus className="w-5 h-5" />
            {t('captureAnother')}
          </Button>
          <Button as={Link} href={ROUTES.admin.erfassungFactsheet(productId)} variant="outline">
            <Printer className="w-5 h-5" />
            {t('printFactsheet')}
          </Button>
        </div>
      </div>
    </div>
  )
}
