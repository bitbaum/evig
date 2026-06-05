'use client'

import { useTranslations } from 'next-intl'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { AIFieldBadge } from '@/components/ai/AIFieldIndicator'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">{t('problemHeading')}</Heading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
            {t('deviceBrand')}
            {aiFieldMeta.deviceBrand && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceBrand.confidence, model: aiFieldMeta.deviceBrand.model, timestamp: aiFieldMeta.deviceBrand.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <Input
            type="text"
            value={deviceBrand}
            onChange={(e) => onDeviceBrandChange(e.target.value)}
            placeholder={t('deviceBrandPlaceholder')}
            className="px-4 border-default rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
            {t('deviceModel')}
            {aiFieldMeta.deviceModel && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceModel.confidence, model: aiFieldMeta.deviceModel.model, timestamp: aiFieldMeta.deviceModel.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <Input
            type="text"
            value={deviceModel}
            onChange={(e) => onDeviceModelChange(e.target.value)}
            placeholder={t('deviceModelPlaceholder')}
            className="px-4 border-default rounded-lg"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
          {t('problemTitle')} *
          {aiFieldMeta.title && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.title.confidence, model: aiFieldMeta.title.model, timestamp: aiFieldMeta.title.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('problemTitlePlaceholder')}
          className="px-4 border-default rounded-lg"
        />
        <span className="text-xs text-text-muted">{title.length}/200</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
          {t('problemDescription')}
          {aiFieldMeta.description && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.description.confidence, model: aiFieldMeta.description.model, timestamp: aiFieldMeta.description.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('problemDescriptionPlaceholder')}
          rows={5}
        />
        <span className="text-xs text-text-muted">{description.length}/5000</span>
      </div>
    </div>
  )
}
