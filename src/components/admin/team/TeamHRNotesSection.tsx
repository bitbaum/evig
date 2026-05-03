'use client'

import { FileText, ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  hrNotes: string
  isOpen: boolean
  onToggle: () => void
  onChange: (field: string, value: string) => void
}

export function TeamHRNotesSection({ hrNotes, isOpen, onToggle, onChange }: Props) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-900 dark:text-yellow-200">
            HR-Notizen (Vertraulich)
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-yellow-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-yellow-600" />
        )}
      </button>

      {isOpen && (
        <div className="p-6 pt-2 border-t border-yellow-200 dark:border-yellow-800">
          <textarea
            value={hrNotes}
            onChange={(e) => onChange('hr_notes', e.target.value)}
            rows={4}
            placeholder="Vertrauliche HR-Notizen (nur für Super-Admins sichtbar)..."
            className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
            Diese Notizen sind nur für Super-Admins sichtbar.
          </p>
        </div>
      )}
    </div>
  )
}
