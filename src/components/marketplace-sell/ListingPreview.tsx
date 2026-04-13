import Image from 'next/image'
import { ArrowLeft, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { formatCHF, DELIVERY_LABELS, PAYMENT_MODE_LABELS } from '@/config/marketplace'
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
  const conditionLabel = ZUSTAND_OPTIONS.find(o => o.value === formData.condition)?.label || formData.condition

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Bearbeitung
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <Heading level={1} className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Vorschau
          </Heading>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            So wird dein Inserat im Marketplace angezeigt.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {formData.images.map((url, idx) => (
                <Image key={idx} src={url} alt={`Bild ${idx + 1}`} width={200} height={200} className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Heading level={2} className="text-2xl font-bold text-gray-900 dark:text-white">{formData.title}</Heading>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCHF(parseFloat(formData.price) || 0)}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{formData.category}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{conditionLabel}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {formData.brand && <div className="flex justify-between"><span className="text-gray-500">Marke</span><span>{formData.brand}</span></div>}
              {formData.model && <div className="flex justify-between"><span className="text-gray-500">Modell</span><span>{formData.model}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Lieferung</span><span>{DELIVERY_LABELS[formData.deliveryOptions as DeliveryOption]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Zahlung</span><span>{PAYMENT_MODE_LABELS[formData.paymentMode as PaymentMode]}</span></div>
              {formData.pickupLocation && <div className="flex justify-between"><span className="text-gray-500">Standort</span><span>{formData.pickupLocation}</span></div>}
            </div>
          </div>

          <div>
            <Heading level={3} className="font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</Heading>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">{formData.description}</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onEdit}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Bearbeiten
          </button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 gap-2 px-6 py-2.5 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {editId ? 'Wird gespeichert...' : 'Wird veröffentlicht...'}
              </>
            ) : (
              editId ? 'Änderungen speichern' : 'Inserat veröffentlichen'
            )}
          </Button>
        </div>
      </div>

      {success && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
}
