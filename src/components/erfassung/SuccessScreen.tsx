'use client'

import { Link } from '@/i18n/navigation'
import { Package, Printer, Plus, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
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
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-primary-600" />
        </div>
        <Heading level={2} className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {t('title')}
        </Heading>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {t('itemUUIDLabel')} <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">{itemUUID}</code>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href={ROUTES.admin.productFactsheet(productId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            {t('printFactsheet')}
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('captureAnother')}
          </button>
          <Link
            href={ROUTES.admin.products}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            {t('toOverview')}
          </Link>
        </div>
      </div>
    </div>
  )
}
