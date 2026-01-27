'use client'

/**
 * DataEntryTabs Component
 *
 * Three-mode data entry UI for product capture:
 * - Speech (Sprache): Voice recording → AI extraction → Form prefill
 * - Picture (Bild): Photo/upload → AI analysis → Form prefill
 * - Form (Formular): Direct manual entry
 *
 * Usage:
 *   <DataEntryTabs
 *     onProductData={(data) => mergeWithForm(data)}
 *     onImageCapture={(base64) => setImage(base64)}
 *   />
 */

import { useState, useCallback } from 'react'
import { Mic, Camera, FileText, ArrowDown } from 'lucide-react'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { ImageCapture } from '@/components/erfassung/ImageCapture'
import { logger } from '@/lib/logger'
import type { VoiceProductData, ErfassungFormData } from '@/types/erfassung'

export type EntryMode = 'speech' | 'picture' | 'form'

interface DataEntryTabsProps {
  onProductData: (data: Partial<ErfassungFormData>) => void
  onImageCapture?: (imageBase64: string) => void
  onError?: (error: string) => void
  activeMode?: EntryMode
  className?: string
}

interface TabConfig {
  id: EntryMode
  label: string
  icon: React.ReactNode
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'speech',
    label: 'Sprache',
    icon: <Mic className="w-4 h-4" />,
    description: 'Produkt per Sprache erfassen',
  },
  {
    id: 'picture',
    label: 'Bild',
    icon: <Camera className="w-4 h-4" />,
    description: 'Produkt per Foto erfassen',
  },
  {
    id: 'form',
    label: 'Formular',
    icon: <FileText className="w-4 h-4" />,
    description: 'Direkt ins Formular eingeben',
  },
]

export function DataEntryTabs({
  onProductData,
  onImageCapture,
  onError,
  activeMode: initialMode = 'speech',
  className = '',
}: DataEntryTabsProps) {
  const [activeMode, setActiveMode] = useState<EntryMode>(initialMode)

  // Handle voice transcription complete
  const handleVoiceData = useCallback(
    (data: VoiceProductData) => {
      logger.info('Voice data received', { product: data.produktname })
      // Convert VoiceProductData to Partial<ErfassungFormData>
      const formData: Partial<ErfassungFormData> = {
        hersteller: data.hersteller,
        produktname: data.produktname,
        kurzbeschreibung: data.kurzbeschreibung,
        specs: data.specs,
        verkaufspreis: data.verkaufspreis,
        zustand: data.zustand,
        hauptkategorie: data.hauptkategorie,
        unterkategorie: data.unterkategorie,
        kundenprofile: data.kundenprofile,
      }
      onProductData(formData)
    },
    [onProductData]
  )

  // Handle image capture
  const handleImageCapture = useCallback(
    (base64: string) => {
      onImageCapture?.(base64)
    },
    [onImageCapture]
  )

  // Handle image analysis complete
  const handleImageAnalysis = useCallback(
    (data: Partial<ErfassungFormData>) => {
      logger.info('Image analysis data received', { product: data.produktname })
      onProductData(data)
    },
    [onProductData]
  )

  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden ${className}`}
    >
      {/* Tab headers */}
      <div className="flex border-b border-purple-200 dark:border-purple-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMode(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeMode === tab.id
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {/* Speech mode */}
        {activeMode === 'speech' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sprach-Erfassung
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sag einfach was du erfassen willst, z.B. &quot;Dell Latitude
                7470, guter Zustand, 280 Franken&quot;
              </p>
            </div>
            <VoiceRecorder
              onTranscriptionComplete={handleVoiceData}
              onError={onError}
            />
          </div>
        )}

        {/* Picture mode */}
        {activeMode === 'picture' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bild-Erfassung
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lade ein Produktbild hoch und lass die KI die Details erkennen
              </p>
            </div>
            <ImageCapture
              onImageCapture={handleImageCapture}
              onAnalysisComplete={handleImageAnalysis}
              onError={onError}
            />
          </div>
        )}

        {/* Form mode */}
        {activeMode === 'form' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDown className="w-8 h-8 text-purple-600 animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manuelle Eingabe
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fülle das Formular unten direkt aus
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
