'use client'

import { Home } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import type { LocationFormData } from './types'
import { SWISS_CANTONS } from './types'

interface Props {
  formData: LocationFormData
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
}

export function LocationAddressSection({ formData, onFieldChange }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-text-primary mb-4 flex items-center">
        <Home className="w-5 h-5 mr-2" />
        Adresse & Standort
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Strasse und Hausnummer" required htmlFor="address-line1" className="md:col-span-2">
          <Input
            id="address-line1"
            type="text"
            value={formData.address_line1}
            onChange={(e) => onFieldChange('address_line1', e.target.value)}
            placeholder="z.B. Musterstrasse 123"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Adresszusatz (optional)" htmlFor="address-line2" className="md:col-span-2">
          <Input
            id="address-line2"
            type="text"
            value={formData.address_line2}
            onChange={(e) => onFieldChange('address_line2', e.target.value)}
            placeholder="z.B. c/o Mustermann, 3. Stock"
          />
        </FormField>

        <FormField label="PLZ" required htmlFor="postal-code">
          <Input
            id="postal-code"
            type="text"
            value={formData.postal_code}
            onChange={(e) => onFieldChange('postal_code', e.target.value)}
            placeholder="8000"
            maxLength={4}
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Ort" required htmlFor="city">
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => onFieldChange('city', e.target.value)}
            placeholder="Zürich"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Kanton" htmlFor="canton">
          <Select
            id="canton"
            value={formData.canton}
            onChange={(e) => onFieldChange('canton', e.target.value)}
          >
            <option value="">Kanton wählen</option>
            {SWISS_CANTONS.map(canton => (
              <option key={canton} value={canton}>{canton}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Land" htmlFor="country">
          <Input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) => onFieldChange('country', e.target.value)}
          />
        </FormField>

        <FormField label="Breitengrad (optional)" htmlFor="latitude">
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={formData.latitude}
            onChange={(e) => onFieldChange('latitude', e.target.value)}
            placeholder="47.3769"
          />
        </FormField>

        <FormField label="Längengrad (optional)" htmlFor="longitude">
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={formData.longitude}
            onChange={(e) => onFieldChange('longitude', e.target.value)}
            placeholder="8.5417"
          />
        </FormField>
      </div>
    </div>
  )
}
