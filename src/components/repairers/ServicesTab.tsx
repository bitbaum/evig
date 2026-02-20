'use client'

import { Clock, Wrench } from 'lucide-react'
import { type RepairerService } from './types'
import { formatPrice, getServiceIcon } from './helpers'

interface ServicesTabProps {
  services: RepairerService[]
  servicesOffered: string[]
}

export function ServicesTab({ services, servicesOffered }: ServicesTabProps) {
  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Keine spezifischen Services hinterlegt.</p>
          <p className="text-sm mt-2">
            Kontaktieren Sie den Reparateur für ein individuelles Angebot.
          </p>
        </div>
      ) : (
        services.map((service) => (
          <div
            key={service.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getServiceIcon(service.service_category)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{service.service_name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {service.service_category.replace('_', ' ')}
                  </p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {service.estimated_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ca. {service.estimated_hours}h
                      </span>
                    )}
                    {service.parts_included && (
                      <span className="text-green-600">Teile inkl.</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatPrice(service.base_price_cents)}
                </p>
                {service.hourly_rate_cents && (
                  <p className="text-xs text-gray-500">
                    oder {formatPrice(service.hourly_rate_cents)}/Std
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {servicesOffered.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Allgemeine Servicebereiche</h4>
          <div className="flex flex-wrap gap-2">
            {servicesOffered.map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {getServiceIcon(service)}
                <span className="ml-1 capitalize">{service.replace('_', ' ')}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
