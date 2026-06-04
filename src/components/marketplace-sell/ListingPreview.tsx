'use client'

import Image from 'next/image'
import { ArrowLeft, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { formatCHF, DELIVERY_LABELS, PAYMENT_MODE_LABELS, MARKETPLACE_CATEGORY_LABELS } from '@/config/marketplace'
import type { DeliveryOption, PaymentMode } from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import type { ListingFormData } from './types'

interface Props {
  formData: ListingFormData
  editId: string | null
  isSubmitting: boolean
  success: string | null
  error: string | null
  onEdit: () => void
  onSubmit: () => void
}

export function ListingPreview({ formData, editId, isSubmitting, success, error, onEdit, onSubmit }: Props) {
  const t = useTranslations('marketplace.sell.preview')
  const tCommon = useTranslations('common')
  const conditionLabel = ZUSTAND_OPTIONS.find(o => o.value === formData.condition)?.label || formData.condition

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToEdit')}
      </button>

      <div className="card-shell overflow-hidden">
        <div className="p-6 border-b border-subtle dark:border-neutral-700">
          <Heading level={1} className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t('title')}
          </Heading>
          <p className="text-sm text-text-tertiary mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {formData.images.map((url, idx) => (
                <Image key={idx} src={url} alt={t('imageAlt', { n: idx + 1 })} width={200} height={200} className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Heading level={2} className="text-2xl font-bold text-text-primary">{formData.title}</Heading>
              <p className="text-3xl font-bold text-action mt-2">{formatCHF(parseFloat(formData.price) || 0)}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-raised dark:bg-neutral-700 text-text-secondary">{MARKETPLACE_CATEGORY_LABELS[formData.category] || formData.category}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-raised text-neutral-800">{conditionLabel}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {formData.brand && <div className="flex justify-between"><span className="text-text-tertiary">{t('brand')}</span><span>{formData.brand}</span></div>}
              {formData.model && <div className="flex justify-between"><span className="text-text-tertiary">{t('model')}</span><span>{formData.model}</span></div>}
              <div className="flex justify-between"><span className="text-text-tertiary">{t('delivery')}</span><span>{DELIVERY_LABELS[formData.deliveryOptions as DeliveryOption]}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">{t('payment')}</span><span>{PAYMENT_MODE_LABELS[formData.paymentMode as PaymentMode]}</span></div>
              {formData.pickupLocation && <div className="flex justify-between"><span className="text-text-tertiary">{t('location')}</span><span>{formData.pickupLocation}</span></div>}
            </div>
          </div>

          <div>
            <Heading level={3} className="font-semibold text-text-primary mb-2">{t('description')}</Heading>
            <p className="text-text-secondary whitespace-pre-line text-sm">{formData.description}</p>
          </div>
        </div>

        <div className="p-6 border-t border-subtle dark:border-neutral-700 flex gap-3">
          <button
            onClick={onEdit}
            className="px-6 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 font-medium text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            {tCommon('edit')}
          </button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 gap-2 px-6 py-2.5 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {editId ? t('saving') : t('publishing')}
              </>
            ) : (
              editId ? t('saveChanges') : t('publish')
            )}
          </Button>
        </div>
      </div>

      {success && (
        <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-action flex-shrink-0" />
          <p className="text-primary-800 dark:text-primary-200 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
          <p className="text-error-800 dark:text-error-200">{error}</p>
        </div>
      )}
    </div>
  )
}
