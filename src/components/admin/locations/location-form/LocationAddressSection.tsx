'use client'

import { Home } from 'lucide-react'
import type { LocationFormData } from './types'
import { SWISS_CANTONS } from './types'

interface Props {
  formData: LocationFormData
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
}

export function LocationAddressSection({ formData, onFieldChange }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Home className="w-5 h-5 mr-2" />
        Adresse & Standort
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strasse und Hausnummer *
          </label>
          <input
            type="text"
            value={formData.address_line1}
            onChange={(e) => onFieldChange('address_line1', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Musterstrasse 123"
            required
            aria-required="true"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresszusatz (optional)
          </label>
          <input
            type="text"
            value={formData.address_line2}
            onChange={(e) => onFieldChange('address_line2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. c/o Mustermann, 3. Stock"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PLZ *
          </label>
          <input
            type="text"
            value={formData.postal_code}
            onChange={(e) => onFieldChange('postal_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="8000"
            maxLength={4}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ort *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => onFieldChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Zürich"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kanton
          </label>
          <select
            value={formData.canton}
            onChange={(e) => onFieldChange('canton', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Kanton wählen</option>
            {SWISS_CANTONS.map(canton => (
              <option key={canton} value={canton}>{canton}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Land
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => onFieldChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Breitengrad (optional)
          </label>
          <input
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={formData.latitude}
            onChange={(e) => onFieldChange('latitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="47.3769"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Längengrad (optional)
          </label>
          <input
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={formData.longitude}
            onChange={(e) => onFieldChange('longitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="8.5417"
          />
        </div>
      </div>
    </div>
  )
}
