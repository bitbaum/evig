'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import type { ChecklistGroup as ChecklistGroupType } from './types'

interface ChecklistGroupProps {
  group: ChecklistGroupType
  onToggle: (itemId: string, completed: boolean) => void
}

export function ChecklistGroup({ group, onToggle }: ChecklistGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const completedCount = group.items.filter(i => i.state.completed).length

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium text-sm">{group.label}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          completedCount === group.items.length
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {completedCount}/{group.items.length}
        </span>
      </button>

      {expanded && (
        <div className="divide-y">
          {group.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 ${
                item.state.completed ? 'bg-green-50' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(item.id, !item.state.completed)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  item.state.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {item.state.completed && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${item.state.completed ? 'line-through text-gray-500' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                {item.state.completed && item.state.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Erledigt am {new Date(item.state.completedAt).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
