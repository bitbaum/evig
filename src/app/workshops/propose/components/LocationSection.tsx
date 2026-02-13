'use client'

import { MapPin } from 'lucide-react'
import { responsiveTypography } from '@/lib/responsive'

interface WorkshopLocation {
  id: string
  name: string
  address?: string
  city?: string
  canton?: string
  capacity?: number
  max_capacity?: number
}

interface LocationSectionProps {
  locationType: 'venue' | 'online' | 'home'
  selectedLocationId: string
  proposedLocation: string
  proposedDate: string
  proposedTime: string
  specialRequirements: string
  availableLocations: WorkshopLocation[]
  loadingLocations: boolean
  onChange: (field: string, value: string) => void
  onLocationSelect: (locationId: string, locationName: string) => void
}

export function LocationSection({
  locationType,
  selectedLocationId,
  proposedLocation,
  proposedDate,
  proposedTime,
  specialRequirements,
  availableLocations,
  loadingLocations,
  onChange,
  onLocationSelect
}: LocationSectionProps) {
  return (
    <div className="mb-8">
      <h2 className={`${responsiveTypography.subsection} font-semibold text-gray-900 mb-4 flex items-center`}>
        <MapPin className="w-5 h-5 mr-2" />
        Ort & Zeitplan
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Art des Workshops *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="venue"
                checked={locationType === 'venue'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">In einem Veranstaltungsort (z.B. Gemeinschaftszentrum)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={locationType === 'online'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Online über Video-Konferenz</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="home"
                checked={locationType === 'home'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Bei Ihnen zu Hause oder in Ihren Räumlichkeiten</span>
            </label>
          </div>
        </div>

        {locationType === 'venue' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verfügbare Orte
              </label>
              {loadingLocations ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Lade verfügbare Orte...</span>
                </div>
              ) : availableLocations.length > 0 ? (
                <select
                  value={selectedLocationId}
                  onChange={(e) => {
                    const selectedLocation = availableLocations.find(loc => loc.id === e.target.value)
                    onLocationSelect(
                      e.target.value,
                      selectedLocation ? `${selectedLocation.name}, ${selectedLocation.city}` : ''
                    )
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Ort auswählen...</option>
                  {availableLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.canton}
                      {location.max_capacity && ` (max. ${location.max_capacity} Personen)`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p>Keine genehmigten Veranstaltungsorte verfügbar.</p>
                  <p className="mt-1">Sie können einen neuen Ort vorschlagen oder einen bestehenden Ort zur Genehmigung einreichen.</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternativer Ort (falls kein passender verfügbar)
              </label>
              <input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. Mein Zuhause, oder neuer Veranstaltungsort"
              />
              <p className="text-xs text-gray-500 mt-1">
                Verwenden Sie dieses Feld, wenn Sie einen neuen Ort vorschlagen möchten
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorgeschlagenes Datum
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorgeschlagene Uhrzeit
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {locationType === 'home' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ihre vollständige Adresse"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorgeschlagenes Datum
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorgeschlagene Uhrzeit
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Besondere Anforderungen
          </label>
          <textarea
            value={specialRequirements}
            onChange={(e) => onChange('specialRequirements', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Beamer, Whiteboard, Internetzugang, spezielle Software"
          />
        </div>
      </div>
    </div>
  )
}
