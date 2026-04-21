'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, StickyNote } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import type { ChecklistGroup as ChecklistGroupType } from './types'

interface ChecklistGroupProps {
  group: ChecklistGroupType
  onToggle: (itemId: string, completed: boolean, notes?: string) => void
}

export function ChecklistGroup({ group, onToggle }: ChecklistGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({})
  const [notesText, setNotesText] = useState<Record<string, string>>({})
  const completedCount = group.items.filter(i => i.state.completed).length

  const openNotes = (itemId: string, existing: string) => {
    setNotesText(t => ({ ...t, [itemId]: notesText[itemId] ?? existing }))
    setNotesOpen(prev => ({ ...prev, [itemId]: true }))
  }

  const saveNotes = (itemId: string, completed: boolean) => {
    onToggle(itemId, completed, notesText[itemId]?.trim() ?? '')
    setNotesOpen(prev => ({ ...prev, [itemId]: false }))
  }

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
              className={`p-3 transition-colors ${item.state.completed ? 'bg-green-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggle(item.id, !item.state.completed)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.state.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  aria-label={item.state.completed ? `${item.label} rückgängig machen` : `${item.label} abhaken`}
                >
                  {item.state.completed && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Label + required marker */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${item.state.completed ? 'line-through text-gray-400' : 'font-medium text-gray-900'}`}>
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="text-xs text-red-500" title="Pflichtpunkt">*</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>

                  {/* Completed metadata + notes */}
                  {item.state.completed && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.state.completedAt && (
                          <span className="text-xs text-green-600">
                            Erledigt am {formatDateShort(item.state.completedAt)}
                          </span>
                        )}
                        {!notesOpen[item.id] && (
                          <button
                            type="button"
                            onClick={() => openNotes(item.id, item.state.notes)}
                            className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
                          >
                            <StickyNote className="w-3 h-3" />
                            {item.state.notes ? 'Notiz bearbeiten' : 'Notiz hinzufügen'}
                          </button>
                        )}
                      </div>

                      {/* Existing note preview (when textarea not open) */}
                      {item.state.notes && !notesOpen[item.id] && (
                        <p className="text-xs text-gray-500 italic pl-0.5">„{item.state.notes}"</p>
                      )}
                    </div>
                  )}

                  {/* Notes editor */}
                  {notesOpen[item.id] && (
                    <div className="mt-2 space-y-1.5">
                      <textarea
                         
                        autoFocus
                        value={notesText[item.id] ?? ''}
                        onChange={(e) => setNotesText(t => ({ ...t, [item.id]: e.target.value }))}
                        placeholder="z.B. CPU-Stresstest bestanden, max. 75 °C ..."
                        rows={2}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveNotes(item.id, item.state.completed)}
                          className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotesOpen(prev => ({ ...prev, [item.id]: false }))}
                          className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50 transition-colors"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
