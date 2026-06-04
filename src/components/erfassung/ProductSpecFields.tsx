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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    <div className="card-shell p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span>{t('title')}</span>
          {aiMetadata.specs && (
            <AIFieldIndicator source={aiMetadata.specs} fieldName="specs" />
          )}
        </Heading>
        <button
          type="button"
          onClick={onSpecAdd}
          className="inline-flex items-center gap-1 text-sm text-action hover:text-primary-700 touch-manipulation p-2 -m-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('addField')}</span>
        </button>
      </div>

      <div className="space-y-3">
        {specs.map((spec, index) => (
          <div key={index} className="flex gap-2 sm:gap-3">
            <Input
              type="text"
              value={spec.key}
              onChange={(e) => onSpecChange(index, 'key', e.target.value)}
              className="w-1/3"
              placeholder={t('keyPlaceholder')}
            />
            <Input
              type="text"
              value={spec.value}
              onChange={(e) => onSpecChange(index, 'value', e.target.value)}
              className="flex-1"
              placeholder={t('valuePlaceholder')}
            />
            <Button
              type="button"
              variant="destructive-ghost"
              size="icon"
              onClick={() => onSpecRemove(index)}
              disabled={specs.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
