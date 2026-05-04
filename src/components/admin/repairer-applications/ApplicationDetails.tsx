import { Star, FileText } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { RepairerApplication } from './types'

interface Props {
  application: RepairerApplication
}

export function ApplicationDetails({ application }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-4">
        <div>
          <Heading level={4} className="text-neutral-900 mb-2">Beschreibung</Heading>
          <p className="text-neutral-600 text-sm">{application.description}</p>
        </div>

        <div>
          <Heading level={4} className="text-neutral-900 mb-2">Dienstleistungen</Heading>
          <div className="flex flex-wrap gap-2">
            {application.servicesOffered.map((service, index) => (
              <span key={index} className="px-2 py-1 bg-info-100 text-info-800 rounded-full text-xs">
                {service}
              </span>
            ))}
          </div>
        </div>

        <div>
          <Heading level={4} className="text-neutral-900 mb-2">Spezialisierungen</Heading>
          <div className="flex flex-wrap gap-2">
            {application.specializations.map((spec, index) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                {spec}
              </span>
            ))}
          </div>
        </div>

        {application.certifications.length > 0 && (
          <div>
            <Heading level={4} className="text-neutral-900 mb-2">Zertifizierungen</Heading>
            <div className="space-y-1">
              {application.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-warning-500" />
                  <span>{typeof cert === 'string' ? cert : cert.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Heading level={4} className="text-neutral-900 mb-1">Stundensatz</Heading>
            <p className="text-neutral-600 text-sm">
              {application.hourlyRateCents
                ? `CHF ${(application.hourlyRateCents / 100).toFixed(0)}/Std`
                : 'Nicht angegeben'
              }
            </p>
          </div>
          <div>
            <Heading level={4} className="text-neutral-900 mb-1">Service-Radius</Heading>
            <p className="text-neutral-600 text-sm">{application.serviceRadiusKm} km</p>
          </div>
        </div>

        <div>
          <Heading level={4} className="text-neutral-900 mb-2">Adresse</Heading>
          <p className="text-neutral-600 text-sm">
            {application.address}<br />
            {application.postalCode} {application.city}
          </p>
        </div>

        {application.verificationDocuments.length > 0 && (
          <div>
            <Heading level={4} className="text-neutral-900 mb-2">Verifizierungsdokumente</Heading>
            <div className="space-y-1">
              {application.verificationDocuments.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-info-600 hover:text-info-700"
                >
                  <FileText className="w-4 h-4" />
                  Dokument {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {application.adminNotes && (
          <div>
            <Heading level={4} className="text-neutral-900 mb-2">Admin-Notizen</Heading>
            <p className="text-neutral-600 text-sm bg-neutral-50 p-2 rounded">{application.adminNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
