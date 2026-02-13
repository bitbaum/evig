'use client'

import { Target } from 'lucide-react'
import { responsiveTypography, responsiveButtons } from '@/lib/responsive'

interface LearningObjectivesSectionProps {
  objectives: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export function LearningObjectivesSection({
  objectives,
  onAdd,
  onUpdate,
  onRemove
}: LearningObjectivesSectionProps) {
  return (
    <div className="mb-8">
      <h2 className={`${responsiveTypography.subsection} font-semibold text-gray-900 mb-4 flex items-center`}>
        <Target className="w-5 h-5 mr-2" />
        Lernziele
      </h2>

      <div className="space-y-3">
        {objectives.map((objective, index) => (
          <div key={index} className="flex gap-3">
            <input
              type="text"
              value={objective}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="z.B. Grundlagen der Linux-Befehlszeile beherrschen"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className={`${responsiveButtons.small} text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors`}
            >
              Entfernen
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 rounded-lg transition-colors"
        >
          + Lernziel hinzufügen
        </button>
      </div>
    </div>
  )
}
