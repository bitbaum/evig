'use client'

import { AlertCircle, Building, Home, Loader2 } from 'lucide-react'
import { type RepairerProfile } from './types'
import { SERVICE_CATEGORIES, URGENCY_OPTIONS, formatPrice } from './helpers'
import { formatDateLong } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface BookingStepConfirmProps {
  repairer: RepairerProfile
  serviceCategory: string
  deviceInfo: string
  urgency: string
  selectedDate: string
  selectedTime: string
  isHomeVisit: boolean
  setIsHomeVisit: (v: boolean) => void
  visitAddress: string
  setVisitAddress: (v: string) => void
  visitPostalCode: string
  setVisitPostalCode: (v: string) => void
  visitCity: string
  setVisitCity: (v: string) => void
  canProceed: boolean
  submitting: boolean
  isAuthenticated: boolean
  onBack: () => void
  onSubmit: () => void
}

export function BookingStepConfirm({
  repairer,
  serviceCategory,
  deviceInfo,
  urgency,
  selectedDate,
  selectedTime,
  isHomeVisit,
  setIsHomeVisit,
  visitAddress,
  setVisitAddress,
  visitPostalCode,
  setVisitPostalCode,
  visitCity,
  setVisitCity,
  canProceed,
  submitting,
  isAuthenticated,
  onBack,
  onSubmit,
}: BookingStepConfirmProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <Heading level={2} className="text-lg font-semibold text-gray-900 mb-6">Reparaturort & Bestätigung</Heading>

      {/* Location Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Wo soll die Reparatur stattfinden?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setIsHomeVisit(false)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              !isHomeVisit
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building className="w-6 h-6 text-gray-600 mb-2" />
            <span className="font-medium text-gray-900 block">Beim Reparateur</span>
            <span className="text-sm text-gray-500">{repairer.city}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsHomeVisit(true)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              isHomeVisit
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Home className="w-6 h-6 text-gray-600 mb-2" />
            <span className="font-medium text-gray-900 block">Hausbesuch</span>
            <span className="text-sm text-gray-500">
              {repairer.home_visit_fee_cents
                ? `+${formatPrice(repairer.home_visit_fee_cents)}`
                : 'Auf Anfrage'}
            </span>
          </button>
        </div>
      </div>

      {/* Home Visit Address */}
      {isHomeVisit && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <Heading level={3} className="font-medium text-gray-900">deine Adresse</Heading>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Strasse & Hausnummer *</label>
            <input
              type="text"
              value={visitAddress}
              onChange={(e) => setVisitAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">PLZ *</label>
              <input
                type="text"
                value={visitPostalCode}
                onChange={(e) => setVisitPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Ort *</label>
              <input
                type="text"
                value={visitCity}
                onChange={(e) => setVisitCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <Heading level={3} className="font-medium text-gray-900 mb-3">Zusammenfassung</Heading>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Reparateur:</dt>
            <dd className="font-medium">{repairer.business_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Kategorie:</dt>
            <dd className="font-medium">
              {SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)?.label}
            </dd>
          </div>
          {deviceInfo && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Gerät:</dt>
              <dd className="font-medium">{deviceInfo}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Dringlichkeit:</dt>
            <dd className="font-medium">
              {URGENCY_OPTIONS.find((u) => u.value === urgency)?.label}
            </dd>
          </div>
          {selectedDate && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Wunschtermin:</dt>
              <dd className="font-medium">
                {formatDateLong(selectedDate)}
                {selectedTime && ` um ${selectedTime}`}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Ort:</dt>
            <dd className="font-medium">
              {isHomeVisit ? 'Hausbesuch' : `Beim Reparateur (${repairer.city})`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Login Notice */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">Anmeldung erforderlich</p>
            <p className="text-yellow-700 text-sm">
              du wirst zur Anmeldung weitergeleitet, um die Anfrage abzuschliessen.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={onSubmit}
          disabled={!canProceed || submitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            'Anfrage senden'
          )}
        </button>
      </div>
    </div>
  )
}
