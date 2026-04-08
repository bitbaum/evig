'use client'

import { Award, Shield, Globe } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { type RepairerProfile } from './types'

interface AboutTabProps {
  repairer: RepairerProfile
}

export function AboutTab({ repairer }: AboutTabProps) {
  return (
    <div className="space-y-6">
      {/* Specializations */}
      {repairer.specializations && repairer.specializations.length > 0 && (
        <div>
          <Heading level={4} className="text-sm font-medium text-gray-700 mb-3">Spezialisierungen</Heading>
          <div className="flex flex-wrap gap-2">
            {repairer.specializations.map((spec) => (
              <span
                key={spec}
                className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 capitalize"
              >
                {spec.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {repairer.certifications && repairer.certifications.length > 0 && (
        <div>
          <Heading level={4} className="text-sm font-medium text-gray-700 mb-3">Zertifizierungen</Heading>
          <div className="flex flex-wrap gap-2">
            {repairer.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                <Award className="w-3 h-3 mr-1" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Service Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{repairer.total_jobs_completed}</div>
          <div className="text-sm text-gray-600">Aufträge erledigt</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{repairer.completion_rate}%</div>
          <div className="text-sm text-gray-600">Abschlussrate</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{repairer.response_time_hours}h</div>
          <div className="text-sm text-gray-600">Antwortzeit</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">
            {repairer.typical_turnaround_days} Tage
          </div>
          <div className="text-sm text-gray-600">Typische Dauer</div>
        </div>
      </div>

      {/* Warranty & Insurance */}
      <div className="space-y-3">
        {repairer.warranty_offered && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">
              Garantie: {repairer.warranty_duration_months} Monate
            </span>
          </div>
        )}
        {repairer.insurance_info && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">Versichert: {repairer.insurance_info}</span>
          </div>
        )}
        {repairer.remote_services && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="text-gray-700">Bietet Remote-Support an</span>
          </div>
        )}
      </div>
    </div>
  )
}
