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

  // Below lg the admin bottom nav (h-14, fixed bottom-0) is visible —
  // offset above it so the bulk actions are never covered.
  return (
    <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 bg-surface-base border-t border px-4 py-3 z-40 lg:safe-area-inset-bottom shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left: selection info */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onSelectAll}
            className="text-sm text-action hover:text-action font-medium h-auto px-0 bg-transparent hover:bg-transparent"
          >
            {allSelected ? t('deselectAll') : t('selectAll')}
          </Button>
          <span className="text-sm text-text-secondary">
            {selectedCount} {t('ofText')} {totalCount} {t('selectedText')}
          </span>
        </div>

        {/* Progress bar during save */}
        {isSaving && (
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-action" />
              <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full bg-action rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (savedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-text-tertiary">{savedCount}/{totalCount}</span>
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
            className="gap-1.5 bg-surface-overlay hover:bg-surface-overlay disabled:bg-surface-overlay"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t('draft')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => onSave('erfassen')}
            disabled={selectedCount === 0 || isSaving}
            size="sm"
            variant="primary" className="gap-1.5 disabled:bg-action"
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
