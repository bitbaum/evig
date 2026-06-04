'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { IconPicker } from '../IconPicker'
import { CollapsibleSection } from './CollapsibleSection'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
            className="p-4 bg-surface-raised dark:bg-neutral-700/50 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <GripVertical className="w-4 h-4" />
                <span className="text-sm font-medium">Feature {index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="text"
                value={feature.title}
                onChange={(e) => onUpdate(index, 'title', e.target.value)}
                placeholder="Titel"
              />
              <IconPicker
                value={feature.icon}
                onChange={(icon) => onUpdate(index, 'icon', icon)}
              />
            </div>
            <Textarea
              value={feature.description}
              onChange={(e) => onUpdate(index, 'description', e.target.value)}
              placeholder="Beschreibung"
              rows={2}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 text-action hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Feature hinzufügen
        </button>
      </div>
    </CollapsibleSection>
  )
}
