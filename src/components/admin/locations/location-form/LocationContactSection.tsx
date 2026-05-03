'use client'

import { Phone } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { LocationFormData } from './types'

interface Props {
  formData: LocationFormData
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
}

export function LocationContactSection({ formData, onFieldChange }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-neutral-900 mb-4 flex items-center">
        <Phone className="w-5 h-5 mr-2" />
        Kontaktinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Kontaktperson
          </label>
          <input
            type="text"
            value={formData.contact_name}
            onChange={(e) => onFieldChange('contact_name', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
            placeholder="Max Mustermann"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Telefonnummer
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => onFieldChange('contact_phone', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
            placeholder="+41 79 123 45 67"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            E-Mail-Adresse
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => onFieldChange('contact_email', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
            placeholder="kontakt@ort.ch"
          />
        </div>
      </div>
    </div>
  )
}
