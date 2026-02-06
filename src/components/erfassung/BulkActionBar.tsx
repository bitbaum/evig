'use client'

/**
 * BulkActionBar Component
 *
 * Fixed bottom bar during bulk mode with selection count and save actions.
 */

import { Save, Package, Loader2 } from 'lucide-react'

interface BulkActionBarProps {
  totalCount: number
  selectedCount: number
  isSaving: boolean
  savedCount: number
  onSave: (action: 'draft' | 'erfassen' | 'publish') => void
  onSelectAll: () => void
  allSelected: boolean
}

export function BulkActionBar({
  totalCount,
  selectedCount,
  isSaving,
  savedCount,
  onSave,
  onSelectAll,
  allSelected,
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-30 safe-area-inset-bottom shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left: selection info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            {allSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCount} von {totalCount} ausgewählt
          </span>
        </div>

        {/* Progress bar during save */}
        {isSaving && (
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (savedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{savedCount}/{totalCount}</span>
            </div>
          </div>
        )}

        {/* Right: action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave('draft')}
            disabled={selectedCount === 0 || isSaving}
            className="inline-flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Entwurf</span>
          </button>

          <button
            type="button"
            onClick={() => onSave('erfassen')}
            disabled={selectedCount === 0 || isSaving}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Erfassen</span>
          </button>

          <button
            type="button"
            onClick={() => onSave('publish')}
            disabled={selectedCount === 0 || isSaving}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Erfassen & Shop</span>
          </button>
        </div>
      </div>
    </div>
  )
}
