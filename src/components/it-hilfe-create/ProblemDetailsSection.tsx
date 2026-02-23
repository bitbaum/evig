import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { AIFieldBadge } from '@/components/ai/AIFieldIndicator'

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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Beschreibe das Problem</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Marke
            {aiFieldMeta.deviceBrand && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceBrand.confidence, model: aiFieldMeta.deviceBrand.model, timestamp: aiFieldMeta.deviceBrand.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <input
            type="text"
            value={deviceBrand}
            onChange={(e) => onDeviceBrandChange(e.target.value)}
            placeholder="z.B. Apple, Samsung, Lenovo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            Modell
            {aiFieldMeta.deviceModel && (
              <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.deviceModel.confidence, model: aiFieldMeta.deviceModel.model, timestamp: aiFieldMeta.deviceModel.timestamp, inputText: '', sources: [] }} />
            )}
          </label>
          <input
            type="text"
            value={deviceModel}
            onChange={(e) => onDeviceModelChange(e.target.value)}
            placeholder="z.B. MacBook Pro 2020"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          Titel
          {aiFieldMeta.title && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.title.confidence, model: aiFieldMeta.title.model, timestamp: aiFieldMeta.title.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Kurze Beschreibung"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          Beschreibung
          {aiFieldMeta.description && (
            <AIFieldBadge source={{ type: 'text', confidence: aiFieldMeta.description.confidence, model: aiFieldMeta.description.model, timestamp: aiFieldMeta.description.timestamp, inputText: '', sources: [] }} />
          )}
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Was ist das Problem?"
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
    </div>
  )
}
