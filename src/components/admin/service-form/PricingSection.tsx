'use client'

import { Plus, Trash2 } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface PricingSectionProps {
  pricingBase: string
  pricingDetails: string[]
  pricingMediaPrices: string[] | null
  onBaseChange: (value: string) => void
  onDetailAdd: () => void
  onDetailUpdate: (index: number, value: string) => void
  onDetailRemove: (index: number) => void
  onMediaPriceAdd: () => void
  onMediaPriceUpdate: (index: number, value: string) => void
  onMediaPriceRemove: (index: number) => void
}

export function PricingSection({
  pricingBase,
  pricingDetails,
  pricingMediaPrices,
  onBaseChange,
  onDetailAdd,
  onDetailUpdate,
  onDetailRemove,
  onMediaPriceAdd,
  onMediaPriceUpdate,
  onMediaPriceRemove,
}: PricingSectionProps) {
  return (
    <CollapsibleSection title="Preisanzeige" defaultOpen={false}>
      <div>
        <label htmlFor="pricing-base" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Basis-Preis (Anzeige)
        </label>
        <input
          id="pricing-base"
          type="text"
          value={pricingBase}
          onChange={(e) => onBaseChange(e.target.value)}
          placeholder="z.B. CHF 70/Stunde, Kostenlos, Auf Anfrage"
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Preisdetails
        </span>
        <div className="space-y-2">
          {pricingDetails.map((detail, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={detail}
                onChange={(e) => onDetailUpdate(index, e.target.value)}
                placeholder="Detail-Zeile"
                className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onDetailRemove(index)}
                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onDetailAdd}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Detail hinzufügen
          </button>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Medienpreise (optional, für Datenrettung)
        </span>
        <div className="space-y-2">
          {(pricingMediaPrices || []).map((price, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={price}
                onChange={(e) => onMediaPriceUpdate(index, e.target.value)}
                placeholder="z.B. Disketten: CHF 10 pro Stück"
                className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onMediaPriceRemove(index)}
                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onMediaPriceAdd}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Medienpreis hinzufügen
          </button>
        </div>
      </div>
    </CollapsibleSection>
  )
}
