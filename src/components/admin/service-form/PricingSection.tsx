'use client'

import { Plus, Trash2 } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

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
      <FormField label="Basis-Preis (Anzeige)" htmlFor="pricing-base">
        <Input
          id="pricing-base"
          type="text"
          value={pricingBase}
          onChange={(e) => onBaseChange(e.target.value)}
          placeholder="z.B. CHF 70/Stunde, Kostenlos, Auf Anfrage"
        />
      </FormField>

      <div>
        <span className="block text-sm font-medium text-text-secondary mb-2">
          Preisdetails
        </span>
        <div className="space-y-2">
          {pricingDetails.map((detail, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                value={detail}
                onChange={(e) => onDetailUpdate(index, e.target.value)}
                placeholder="Detail-Zeile"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onDetailRemove(index)}
                variant="destructive-ghost"
                size="icon"
                className="p-2 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/30 rounded-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={onDetailAdd}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-action hover:bg-action-muted rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Detail hinzufügen
          </Button>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-text-secondary mb-2">
          Medienpreise (optional, für Datenrettung)
        </span>
        <div className="space-y-2">
          {(pricingMediaPrices || []).map((price, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                value={price}
                onChange={(e) => onMediaPriceUpdate(index, e.target.value)}
                placeholder="z.B. Disketten: CHF 10 pro Stück"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onMediaPriceRemove(index)}
                variant="destructive-ghost"
                size="icon"
                className="p-2 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/30 rounded-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={onMediaPriceAdd}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-action hover:bg-action-muted rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Medienpreis hinzufügen
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  )
}
