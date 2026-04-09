'use client'

import { SERVICE_CATEGORIES, URGENCY_OPTIONS } from './helpers'
import Heading from '@/components/ui/Heading'

interface BookingStepProblemProps {
  serviceCategory: string
  setServiceCategory: (v: string) => void
  deviceInfo: string
  setDeviceInfo: (v: string) => void
  description: string
  setDescription: (v: string) => void
  urgency: string
  setUrgency: (v: string) => void
  onNext: () => void
  canProceed: boolean
}

export function BookingStepProblem({
  serviceCategory,
  setServiceCategory,
  deviceInfo,
  setDeviceInfo,
  description,
  setDescription,
  urgency,
  setUrgency,
  onNext,
  canProceed,
}: BookingStepProblemProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <Heading level={2} className="text-lg font-semibold text-gray-900 mb-6">Beschreibe Ihr Problem</Heading>

      {/* Service Category */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Gerätekategorie *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setServiceCategory(cat.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                serviceCategory === cat.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-900">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Geräteinformationen (optional)
        </label>
        <input
          type="text"
          value={deviceInfo}
          onChange={(e) => setDeviceInfo(e.target.value)}
          placeholder="z.B. MacBook Pro 2020, iPhone 13, Samsung Galaxy S22..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Problembeschreibung *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Beschreibe das Problem so detailliert wie möglich..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          Mindestens 10 Zeichen ({description.length}/10)
        </p>
      </div>

      {/* Urgency */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Dringlichkeit</label>
        <div className="grid grid-cols-2 gap-3">
          {URGENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgency(opt.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                urgency === opt.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900 block">{opt.label}</span>
              <span className="text-xs text-gray-500">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}
