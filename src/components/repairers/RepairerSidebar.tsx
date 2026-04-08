'use client'

import Link from 'next/link'
import { MapPin, Phone, Globe, ChevronRight } from 'lucide-react'
import { type RepairerProfile, type AvailabilitySlot } from './types'
import { formatPrice } from './helpers'
import { formatDateShort } from '@/lib/date-formats'

interface RepairerSidebarProps {
  repairer: RepairerProfile
  availability: AvailabilitySlot[]
}

export function RepairerSidebar({ repairer, availability }: RepairerSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Contact Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Kontakt</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-900">{repairer.address}</div>
              <div className="text-gray-600">
                {repairer.postal_code} {repairer.city}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${repairer.phone}`} className="text-blue-600 hover:underline">
              {repairer.phone}
            </a>
          </div>
          {repairer.website && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-gray-400" />
              <a
                href={repairer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Website besuchen
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Serviceradius:</span> {repairer.service_radius_km} km
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Preise</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Stundensatz</span>
            <span className="font-medium">{formatPrice(repairer.hourly_rate_cents)}</span>
          </div>
          {repairer.home_visit_fee_cents && (
            <div className="flex justify-between">
              <span className="text-gray-600">Hausbesuch</span>
              <span className="font-medium">+{formatPrice(repairer.home_visit_fee_cents)}</span>
            </div>
          )}
          {repairer.emergency_fee_cents && (
            <div className="flex justify-between">
              <span className="text-gray-600">Notfall-Zuschlag</span>
              <span className="font-medium">+{formatPrice(repairer.emergency_fee_cents)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Availability Preview */}
      {availability.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Nächste Verfügbarkeit</h3>
          <div className="space-y-2">
            {availability.slice(0, 5).map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm p-2 bg-green-50 rounded"
              >
                <span className="text-gray-700">
                  {formatDateShort(slot.date)}
                </span>
                <span className="text-green-700">
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
          <Link
            href={`/repairers/${repairer.id}/book`}
            className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Termin buchen
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}

      {/* CTA Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-2">Reparatur anfragen</h3>
        <p className="text-blue-100 text-sm mb-4">
          Beschreibe dein Problem und erhältst du ein unverbindliches Angebot.
        </p>
        <Link
          href={`/repairers/${repairer.id}/book`}
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          Jetzt anfragen
        </Link>
      </div>
    </div>
  )
}
