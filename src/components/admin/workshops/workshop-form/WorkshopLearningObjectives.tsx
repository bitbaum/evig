'use client'

import { FileText, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  objectives: string[]
  onObjectiveChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function WorkshopLearningObjectives({ objectives, onObjectiveChange, onAdd, onRemove }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level={2} className="text-lg text-neutral-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Lernziele
        </Heading>
        <Button
          type="button"
          onClick={onAdd}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
      </div>

      <div className="space-y-4">
        {objectives.map((objective, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={objective}
                onChange={(e) => onObjectiveChange(index, e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="z.B. Grundlagen der Computer-Hardware verstehen"
              />
            </div>
            {objectives.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-error-600 hover:text-error-700 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
