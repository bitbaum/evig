'use client'

import { Phone } from 'lucide-react'
import { CONTACT } from '@/config/org'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import type { LocationFormData } from './types'

interface Props {
  formData: LocationFormData
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
}

export function LocationContactSection({ formData, onFieldChange }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-text-primary mb-4 flex items-center">
        <Phone className="w-5 h-5 mr-2" />
        Kontaktinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Kontaktperson" htmlFor="contact-name">
          <Input
            id="contact-name"
            type="text"
            value={formData.contact_name}
            onChange={(e) => onFieldChange('contact_name', e.target.value)}
            placeholder="Max Mustermann"
          />
        </FormField>

        <FormField label="Telefonnummer" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => onFieldChange('contact_phone', e.target.value)}
            placeholder={CONTACT.phonePlaceholder}
          />
        </FormField>

        <FormField label="E-Mail-Adresse" htmlFor="contact-email" className="md:col-span-2">
          <Input
            id="contact-email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => onFieldChange('contact_email', e.target.value)}
            placeholder="kontakt@ort.ch"
          />
        </FormField>
      </div>
    </div>
  )
}
