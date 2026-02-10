'use client'

import { Stethoscope, MapPin, ExternalLink } from 'lucide-react'
import { REVAMPIT_STORE } from '@/config/it-hilfe'

interface AIDiagnosisCardProps {
  diagnosis: string
  deviceInfo?: string
}

export function AIDiagnosisCard({ diagnosis, deviceInfo }: AIDiagnosisCardProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Stethoscope className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900">KI-Ersteinschätzung</h3>
      </div>

      {deviceInfo && (
        <p className="text-sm text-gray-500 mb-2">{deviceInfo}</p>
      )}

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{diagnosis}</p>

      <div className="bg-white/60 rounded-lg p-4 mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Du kannst dein Gerät auch direkt vorbeibringen:
            </p>
            <p className="text-sm text-gray-600">
              {REVAMPIT_STORE.name} &ndash; {REVAMPIT_STORE.address}, {REVAMPIT_STORE.postalCode} {REVAMPIT_STORE.city}
            </p>
            <a
              href={REVAMPIT_STORE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-1"
            >
              Auf Google Maps anzeigen
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Dies ist eine automatische Ersteinschätzung und ersetzt keine professionelle Diagnose.
      </p>
    </div>
  )
}
