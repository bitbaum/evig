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
    return { placeholder: tmpl.placeholder, ...(existing || { key: tmpl.key, value: '', unit: undefined }) }
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
              placeholder={spec.placeholder || ''}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
