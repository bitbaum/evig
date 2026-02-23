import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_LIMITS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import type { ListingFormData, ListingFormUpdater } from './types'

interface Props {
  formData: ListingFormData
  setFormData: ListingFormUpdater
}

export function ListingFormFields({ formData, setFormData }: Props) {
  const update = <K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  return (
    <>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
          placeholder="z.B. ThinkPad T480 i5 16GB 256GB SSD"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Beschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
          rows={5}
          placeholder="Beschreiben Sie den Zustand, Spezifikationen und was enthalten ist..."
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
        />
      </div>

      {/* Price + Category + Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preis (CHF) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategorie <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Wählen...</option>
            {MARKETPLACE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zustand <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.condition}
            onChange={(e) => update('condition', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Wählen...</option>
            {ZUSTAND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Brand + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marke <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder="z.B. Lenovo, Dell, Apple"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modell <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => update('model', e.target.value)}
            placeholder="z.B. ThinkPad T480"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Delivery + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lieferung
          </label>
          <select
            value={formData.deliveryOptions}
            onChange={(e) => update('deliveryOptions', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {DELIVERY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zahlungsart
          </label>
          <select
            value={formData.paymentMode}
            onChange={(e) => update('paymentMode', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {PAYMENT_MODES.map(opt => (
              <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Shipping cost (conditional) */}
      {formData.deliveryOptions !== 'pickup' && (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Versandkosten (CHF)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.shippingCost}
            onChange={(e) => update('shippingCost', e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Pickup location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Abholstandort <span className="text-xs text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.pickupLocation}
          onChange={(e) => update('pickupLocation', e.target.value)}
          placeholder="z.B. Zürich, 8005"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </>
  )
}
