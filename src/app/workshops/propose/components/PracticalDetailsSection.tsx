'use client'

import { Clock } from 'lucide-react'
import { responsiveTypography } from '@/lib/responsive'

interface PracticalDetailsSectionProps {
  durationHours: string
  pricePerPerson: string
  maxParticipants: string
  minParticipants: string
  targetAudience: string
  prerequisites: string
  onChange: (field: string, value: string) => void
}

export function PracticalDetailsSection({
  durationHours,
  pricePerPerson,
  maxParticipants,
  minParticipants,
  targetAudience,
  prerequisites,
  onChange
}: PracticalDetailsSectionProps) {
  const maxParticipantsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
  const minParticipantsOptions = [2, 3, 4, 5, 6, 8, 10]

  return (
    <div className="mb-8">
      <h2 className={`${responsiveTypography.subsection} font-semibold text-gray-900 mb-4 flex items-center`}>
        <Clock className="w-5 h-5 mr-2" />
        Praktische Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dauer (Stunden) *
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={durationHours}
            onChange={(e) => onChange('durationHours', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preis pro Person (CHF) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pricePerPerson}
            onChange={(e) => onChange('pricePerPerson', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00 (kostenlos)"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximale Teilnehmerzahl *
          </label>
          <select
            value={maxParticipants}
            onChange={(e) => onChange('maxParticipants', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            aria-required="true"
          >
            {maxParticipantsOptions.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mindestteilnehmerzahl *
          </label>
          <select
            value={minParticipants}
            onChange={(e) => onChange('minParticipants', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            aria-required="true"
          >
            {minParticipantsOptions.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zielgruppe
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => onChange('targetAudience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Anfänger ohne Vorkenntnisse, Jugendliche 14-18 Jahre"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voraussetzungen
          </label>
          <textarea
            value={prerequisites}
            onChange={(e) => onChange('prerequisites', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Eigener Laptop mit Linux installiert"
          />
        </div>
      </div>
    </div>
  )
}
