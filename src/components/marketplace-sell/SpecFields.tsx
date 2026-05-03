/**
 * SpecFields Component
 *
 * Dynamic spec input fields based on the selected category.
 * Uses SPEC_TEMPLATES from erfassung config (SSOT).
 *
 * Template specs appear first (with placeholders), followed by
 * any custom specs the user or AI added that aren't in the template.
 */

import { getSpecTemplate, type SpecTemplate } from '@/config/erfassung/spec-templates'
import type { SpecFieldData } from './types'

interface SpecFieldsProps {
  categoryValue: string
  specs: SpecFieldData[]
  onSpecsChange: (specs: SpecFieldData[]) => void
}

interface MergedSpec {
  key: string
  value: string
  unit?: string
  placeholder?: string
}

export function SpecFields({ categoryValue, specs, onSpecsChange }: SpecFieldsProps) {
  if (!categoryValue) return null

  const template = getSpecTemplate(categoryValue)
  if (!template || template.length === 0) return null

  const mergedSpecs = mergeSpecsWithTemplate(specs, template)

  const handleChange = (key: string, value: string) => {
    const updated: SpecFieldData[] = mergedSpecs.map(s =>
      s.key === key ? { key: s.key, value, unit: s.unit } : { key: s.key, value: s.value, unit: s.unit }
    )
    onSpecsChange(updated)
  }

  return (
    <div>
      <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        Technische Daten
        <span className="text-xs text-neutral-500 ml-1">(optional)</span>
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mergedSpecs.map(spec => (
          <div key={spec.key} className="flex items-center gap-2">
            <label htmlFor={`spec-${spec.key}`} className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24 flex-shrink-0 text-right">
              {spec.key}
            </label>
            <input
              id={`spec-${spec.key}`}
              type="text"
              value={spec.value}
              onChange={(e) => handleChange(spec.key, e.target.value)}
              placeholder={spec.placeholder || ''}
              className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Merge existing specs with template.
 * Template specs come first (with placeholders), preserving existing values.
 * Custom specs (not in template) are appended at the end — never dropped.
 */
function mergeSpecsWithTemplate(specs: SpecFieldData[], template: SpecTemplate[]): MergedSpec[] {
  const templateKeys = new Set(template.map(t => t.key))

  // Template specs first — use existing value if present
  const fromTemplate: MergedSpec[] = template.map(tmpl => {
    const existing = specs.find(s => s.key === tmpl.key)
    return {
      key: tmpl.key,
      value: existing?.value ?? '',
      unit: existing?.unit,
      placeholder: tmpl.placeholder,
    }
  })

  // Custom specs that aren't in the template — preserve them
  const custom: MergedSpec[] = specs
    .filter(s => !templateKeys.has(s.key))
    .map(s => ({ key: s.key, value: s.value, unit: s.unit }))

  return [...fromTemplate, ...custom]
}
