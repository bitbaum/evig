'use client'

import { FileText, Plus, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level={2} className="text-lg text-text-primary flex items-center gap-2">
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
              <Input
                type="text"
                value={objective}
                onChange={(e) => onObjectiveChange(index, e.target.value)}
                placeholder="z.B. Grundlagen der Computer-Hardware verstehen"
              />
            </div>
            {objectives.length > 1 && (
              <Button
                type="button"
                variant="destructive-ghost"
                size="icon"
                onClick={() => onRemove(index)}
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
