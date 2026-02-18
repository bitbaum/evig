'use client'

import { FileText, Plus, Minus } from 'lucide-react'

interface Props {
  objectives: string[]
  onObjectiveChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function WorkshopLearningObjectives({ objectives, onObjectiveChange, onAdd, onRemove }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Lernziele
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>

      <div className="space-y-4">
        {objectives.map((objective, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={objective}
                onChange={(e) => onObjectiveChange(index, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. Grundlagen der Computer-Hardware verstehen"
              />
            </div>
            {objectives.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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
