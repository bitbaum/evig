/**
 * ContactInfoSection Component
 * 
 * Form section for contact information
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

import { ProductFormData } from '../types'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

interface ContactInfoSectionProps {
  contactInfo: string
  onContactInfoChange: (value: string) => void
}

export function ContactInfoSection({ contactInfo, onContactInfoChange }: ContactInfoSectionProps) {
  return (
    <div className="space-y-4">
      <Heading level={3} className={cn('text-lg font-medium', getTextColor('white', 'primary'))}>
        Kontaktinformationen
      </Heading>
      <div>
        <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
          Zusätzliche Kontaktinformationen (optional)
        </label>
        <textarea
          value={contactInfo}
          onChange={(e) => onContactInfoChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
          placeholder="z.B. Telefonnummer, bevorzugte Kontaktzeiten, Versandmöglichkeiten..."
        />
      </div>
    </div>
  )
}



