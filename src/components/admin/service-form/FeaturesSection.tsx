'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { IconPicker } from '../IconPicker'
import { CollapsibleSection } from './CollapsibleSection'
import type { Feature } from './types'

interface FeaturesSectionProps {
  features: Feature[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof Feature, value: string) => void
  onRemove: (index: number) => void
}

export function FeaturesSection({ features, onAdd, onUpdate, onRemove }: FeaturesSectionProps) {
  return (
    <CollapsibleSection title="Features" defaultOpen={false}>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <GripVertical className="w-4 h-4" />
                <span className="text-sm font-medium">Feature {index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={feature.title}
                onChange={(e) => onUpdate(index, 'title', e.target.value)}
                placeholder="Titel"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <IconPicker
                value={feature.icon}
                onChange={(icon) => onUpdate(index, 'icon', icon)}
              />
            </div>
            <textarea
              value={feature.description}
              onChange={(e) => onUpdate(index, 'description', e.target.value)}
              placeholder="Beschreibung"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Feature hinzufügen
        </button>
      </div>
    </CollapsibleSection>
  )
}
