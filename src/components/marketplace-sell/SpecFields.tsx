/**
 * SpecFields Component
 *
 * Dynamic spec input fields based on the selected category.
 * Uses SPEC_TEMPLATES from erfassung config (SSOT).
 */

import { getSpecTemplate } from '@/config/erfassung/spec-templates'
import type { SpecFieldData } from './types'

interface SpecFieldsProps {
  categoryValue: string
  specs: SpecFieldData[]
  onSpecsChange: (specs: SpecFieldData[]) => void
}

export function SpecFields({ categoryValue, specs, onSpecsChange }: SpecFieldsProps) {
  if (!categoryValue) return null

  const template = getSpecTemplate(categoryValue)
  if (!template || template.length === 0) return null

  // Merge template with existing specs (keep existing values, add missing)
  const mergedSpecs = template.map(tmpl => {
    const existing = specs.find(s => s.key === tmpl.key)
    return existing || { key: tmpl.key, value: '', unit: undefined }
  })

  const handleChange = (key: string, value: string) => {
    const updated = mergedSpecs.map(s =>
      s.key === key ? { ...s, value } : s
    )
    onSpecsChange(updated)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Technische Daten
        <span className="text-xs text-gray-400 ml-1">(optional)</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mergedSpecs.map(spec => (
          <div key={spec.key} className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 w-24 flex-shrink-0 text-right">
              {spec.key}
            </label>
            <input
              type="text"
              value={spec.value}
              onChange={(e) => handleChange(spec.key, e.target.value)}
              placeholder={getPlaceholder(spec.key)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function getPlaceholder(key: string): string {
  const placeholders: Record<string, string> = {
    'CPU': 'z.B. Intel i5-8350U',
    'RAM': 'z.B. 16 GB',
    'RAM-Typ': 'z.B. DDR4',
    'Speicher': 'z.B. 512 GB SSD',
    'Display': 'z.B. 14 Zoll',
    'Auflösung': 'z.B. 1920x1080',
    'Grafik': 'z.B. Intel UHD 620',
    'Akku': 'z.B. 6 Stunden',
    'Anschlüsse': 'z.B. USB-C, HDMI, USB-A',
    'WLAN': 'z.B. WiFi 6',
    'OS': 'z.B. Ubuntu 24.04',
    'Grösse': 'z.B. 27 Zoll',
    'Panel': 'z.B. IPS',
    'Helligkeit': 'z.B. 350 cd/m²',
    'Refresh Rate': 'z.B. 144 Hz',
    'Prozessor': 'z.B. Apple M1',
    'Kamera': 'z.B. 12 MP',
    'Hauptkamera': 'z.B. 48 MP',
    'Frontkamera': 'z.B. 12 MP',
  }
  return placeholders[key] || ''
}
