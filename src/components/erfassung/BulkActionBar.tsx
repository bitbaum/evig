'use client'

/**
 * BulkActionBar Component
 *
 * Fixed bottom bar during bulk mode with selection count and save actions.
 */

import { Save, Package, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

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
  const t = useTranslations('components.erfassung.bulkActionBar')

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 z-30 safe-area-inset-bottom shadow-lg">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left: selection info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {selectedCount} {t('ofText')} {totalCount} {t('selectedText')}
          </span>
        </div>

        {/* Progress bar during save */}
        {isSaving && (
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-info-500" />
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-info-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (savedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500">{savedCount}/{totalCount}</span>
            </div>
          </div>
        )}

        {/* Right: action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => onSave('draft')}
            disabled={selectedCount === 0 || isSaving}
            size="sm"
            className="gap-1.5 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-300"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t('draft')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => onSave('erfassen')}
            disabled={selectedCount === 0 || isSaving}
            size="sm"
            variant="primary" className="gap-1.5 disabled:bg-info-300"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">{t('capture')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => onSave('publish')}
            disabled={selectedCount === 0 || isSaving}
            size="sm"
            className="gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">{t('captureAndShop')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
