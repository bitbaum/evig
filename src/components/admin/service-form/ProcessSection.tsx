'use client'

import { Plus, Trash2 } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'
import type { ProcessStep } from './types'

interface ProcessSectionProps {
  steps: ProcessStep[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof ProcessStep, value: string | number) => void
  onRemove: (index: number) => void
}

export function ProcessSection({ steps, onAdd, onUpdate, onRemove }: ProcessSectionProps) {
  return (
    <CollapsibleSection title="Prozess-Schritte" defaultOpen={false}>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Schritt {step.step}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={step.title}
              onChange={(e) => onUpdate(index, 'title', e.target.value)}
              placeholder="Titel des Schritts"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <textarea
              value={step.description}
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
          Schritt hinzufügen
        </button>
      </div>
    </CollapsibleSection>
  )
}
