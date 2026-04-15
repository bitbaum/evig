'use client'

import { Users } from 'lucide-react'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface MaterialsSectionProps {
  materialsProvided: string
  materialsRequired: string
  onChange: (field: string, value: string) => void
}

export function MaterialsSection({
  materialsProvided,
  materialsRequired,
  onChange
}: MaterialsSectionProps) {
  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-gray-900 mb-4 flex items-center`}>
        <Users className="w-5 h-5 mr-2" />
        Materialien & Vorbereitung
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vom Veranstalter bereitgestellte Materialien
          </label>
          <textarea
            value={materialsProvided}
            onChange={(e) => onChange('materialsProvided', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Arbeitsblätter, Beispiel-Code, Getränke"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Von Teilnehmern mitzubringen
          </label>
          <textarea
            value={materialsRequired}
            onChange={(e) => onChange('materialsRequired', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Eigener Laptop, Schreibzeug"
          />
        </div>
      </div>
    </div>
  )
}
