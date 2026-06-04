'use client'

import { Link } from '@/i18n/navigation'
import { Package, Printer, Plus, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

interface SuccessScreenProps {
  itemUUID: string
  productId: string
  onReset: () => void
}

export function SuccessScreen({ itemUUID, productId, onReset }: SuccessScreenProps) {
  const t = useTranslations('components.erfassung.successScreen')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-action" />
        </div>
        <Heading level={2} className="text-2xl font-bold text-text-primary mb-2">
          {t('title')}
        </Heading>
        <p className="text-text-secondary mb-4">
          {t('itemUUIDLabel')} <code className="bg-surface-raised px-2 py-1 rounded-sm">{itemUUID}</code>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button as={Link} href={ROUTES.admin.productFactsheet(productId)} variant="primary">
            <Printer className="w-5 h-5" />
            {t('printFactsheet')}
          </Button>
          <Button type="button" onClick={onReset} variant="secondary">
            <Plus className="w-5 h-5" />
            {t('captureAnother')}
          </Button>
          <Link
            href={ROUTES.admin.products}
            className="inline-flex items-center gap-2 px-4 py-2 border border-default text-text-secondary rounded-lg hover:bg-surface-raised transition-colors"
          >
            <FileText className="w-5 h-5" />
            {t('toOverview')}
          </Link>
        </div>
      </div>
    </div>
  )
}
