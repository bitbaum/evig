'use client'

/**
 * ProductSpecFields
 *
 * Technical specifications section with dynamic key-value pairs.
 * Supports adding/removing spec rows.
 */

import { Plus, Trash2, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AIFieldIndicator } from '@/components/ai/AIFieldIndicator'
import Heading from '@/components/ui/Heading'
import type { AIFieldMetadata, SpecField } from '@/types/erfassung'

interface ProductSpecFieldsProps {
  specs: SpecField[]
  aiMetadata: AIFieldMetadata
  onSpecChange: (index: number, field: 'key' | 'value', value: string) => void
  onSpecAdd: () => void
  onSpecRemove: (index: number) => void
}

export function ProductSpecFields({
  specs,
  aiMetadata,
  onSpecChange,
  onSpecAdd,
  onSpecRemove,
}: ProductSpecFieldsProps) {
  const t = useTranslations('components.erfassung.specFields')

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span>{t('title')}</span>
          {aiMetadata.specs && (
            <AIFieldIndicator source={aiMetadata.specs} fieldName="specs" />
          )}
        </Heading>
        <button
          type="button"
          onClick={onSpecAdd}
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 touch-manipulation p-2 -m-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('addField')}</span>
        </button>
      </div>

      <div className="space-y-3">
        {specs.map((spec, index) => (
          <div key={index} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={spec.key}
              onChange={(e) => onSpecChange(index, 'key', e.target.value)}
              className="w-1/3 px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm touch-manipulation"
              placeholder={t('keyPlaceholder')}
            />
            <input
              type="text"
              value={spec.value}
              onChange={(e) => onSpecChange(index, 'value', e.target.value)}
              className="flex-1 px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm touch-manipulation"
              placeholder={t('valuePlaceholder')}
            />
            <button
              type="button"
              onClick={() => onSpecRemove(index)}
              className="p-2.5 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg touch-manipulation min-w-[44px] flex items-center justify-center"
              disabled={specs.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
