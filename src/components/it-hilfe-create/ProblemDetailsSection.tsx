'use client'

import { useTranslations } from 'next-intl'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { AIFieldBadge } from '@/components/ai/AIFieldIndicator'
import Heading from '@/components/ui/Heading'

interface Props {
  deviceBrand: string
  deviceModel: string
  title: string
  description: string
  onDeviceBrandChange: (value: string) => void
  onDeviceModelChange: (value: string) => void
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  aiFieldMeta: Record<string, AIFieldMetadataEntry>
}

export function ProblemDetailsSection({
  deviceBrand,
  deviceModel,
  title,
  description,
  onDeviceBrandChange,
  onDeviceModelChange,
  onTitleChange,
  onDescriptionChange,
  aiFieldMeta,
}: Props) {
  const t = useTranslations('itHelp.create')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
      <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">{t('problemHeading')}</Heading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
            {t('deviceBrand')}
            {aiFieldMeta.deviceBrand && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceBrand.confidence, model: aiFieldMeta.deviceBrand.model, timestamp: aiFieldMeta.deviceBrand.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <input
            type="text"
            value={deviceBrand}
            onChange={(e) => onDeviceBrandChange(e.target.value)}
            placeholder={t('deviceBrandPlaceholder')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
            {t('deviceModel')}
            {aiFieldMeta.deviceModel && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceModel.confidence, model: aiFieldMeta.deviceModel.model, timestamp: aiFieldMeta.deviceModel.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <input
            type="text"
            value={deviceModel}
            onChange={(e) => onDeviceModelChange(e.target.value)}
            placeholder={t('deviceModelPlaceholder')}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
          {t('problemTitle')} *
          {aiFieldMeta.title && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.title.confidence, model: aiFieldMeta.title.model, timestamp: aiFieldMeta.title.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('problemTitlePlaceholder')}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <span className="text-xs text-neutral-400">{title.length}/200</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-2">
          {t('problemDescription')}
          {aiFieldMeta.description && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.description.confidence, model: aiFieldMeta.description.model, timestamp: aiFieldMeta.description.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('problemDescriptionPlaceholder')}
          rows={5}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <span className="text-xs text-neutral-400">{description.length}/5000</span>
      </div>
    </div>
  )
}
