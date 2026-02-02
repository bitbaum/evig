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
import { Mic, Camera, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import type { VoiceProductData, ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'

// Lazy imports for voice/image tabs (used when showAllTabs is enabled)
// import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
// import { ImageCapture } from '@/components/erfassung/ImageCapture'

export type EntryMode = 'speech' | 'picture' | 'form'

interface DataEntryTabsProps {
  onProductData: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void
  onImageCapture?: (imageBase64: string) => void
  onError?: (error: string) => void
  activeMode?: EntryMode
  className?: string
  showAllTabs?: boolean // Show voice/image tabs (requires self-hosted services)
}

interface TabConfig {
  id: EntryMode
  label: string
  icon: React.ReactNode
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'form',
    label: 'Text',
    icon: <Zap className="w-4 h-4" />,
    description: 'Produktinfos eingeben, KI fuellt aus',
  },
  // Voice and image tabs - coming soon (requires self-hosted services)
  // {
  //   id: 'speech',
  //   label: 'Sprache',
  //   icon: <Mic className="w-4 h-4" />,
  //   description: 'Produkt per Sprache erfassen',
  // },
  // {
  //   id: 'picture',
  //   label: 'Bild',
  //   icon: <Camera className="w-4 h-4" />,
  //   description: 'Produkt per Foto erfassen',
  // },
]

type QuickEntryState = 'idle' | 'loading' | 'success' | 'error'

export function DataEntryTabs({
  onProductData,
  onImageCapture,
  onError,
  activeMode: initialMode = 'form',
  className = '',
  showAllTabs = false,
}: DataEntryTabsProps) {
  const [activeMode, setActiveMode] = useState<EntryMode>(initialMode)
  const [quickText, setQuickText] = useState('')
  const [quickEntryState, setQuickEntryState] = useState<QuickEntryState>('idle')
  const [quickEntryError, setQuickEntryError] = useState<string | null>(null)

  // Handle voice transcription complete
  const handleVoiceData = useCallback(
    (data: VoiceProductData, metadata?: AIFieldMetadata) => {
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
      onProductData(formData, metadata)
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

  // Handle quick text entry with AI
  const handleQuickTextSubmit = useCallback(async () => {
    if (!quickText.trim()) return

    setQuickEntryState('loading')
    setQuickEntryError(null)

    try {
      const response = await fetch('/api/admin/erfassung/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quickText }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
      }

      // Convert to form data and pass to parent with metadata
      const formData: Partial<ErfassungFormData> = {
        hersteller: result.data.hersteller,
        produktname: result.data.produktname,
        kurzbeschreibung: result.data.kurzbeschreibung,
        specs: result.data.specs,
        verkaufspreis: result.data.verkaufspreis,
        zustand: result.data.zustand,
        hauptkategorie: result.data.hauptkategorie,
        unterkategorie: result.data.unterkategorie,
        kundenprofile: result.data.kundenprofile,
      }

      // Pass both form data and metadata to parent
      onProductData(formData, result.metadata as AIFieldMetadata)
      setQuickEntryState('success')
      logger.info('Quick text entry successful', { product: result.data.produktname })

      // Reset after showing success
      setTimeout(() => {
        setQuickEntryState('idle')
        setQuickText('')
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setQuickEntryError(message)
      setQuickEntryState('error')
      onError?.(message)
      logger.error('Quick text entry failed', { error })
    }
  }, [quickText, onProductData, onError])

  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden ${className}`}
    >
      {/* Tab headers - only show if multiple tabs */}
      {TABS.length > 1 && (
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
      )}

      {/* Tab content */}
      <div className="p-6">
        {/* Speech mode - Coming soon (requires self-hosted transcription service) */}
        {activeMode === 'speech' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Spracherfassung kommt bald</p>
            <p className="text-sm">Erfordert selbst-gehosteten Transkriptionsdienst</p>
          </div>
        )}

        {/* Picture mode - Coming soon (requires vision model) */}
        {activeMode === 'picture' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Bilderfassung kommt bald</p>
            <p className="text-sm">Erfordert Vision-KI-Modell</p>
          </div>
        )}

        {/* Form mode with Quick Text Entry */}
        {activeMode === 'form' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                KI-Schnelleingabe
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Beschreibe das Produkt - die KI fuellt das Formular automatisch aus
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && quickText.trim()) {
                    e.preventDefault()
                    handleQuickTextSubmit()
                  }
                }}
                placeholder="z.B. Dell Latitude E7470 i5 8GB 256GB SSD guter Zustand 280 CHF&#10;&#10;Oder: HP EliteBook 840 G5, 16GB RAM, 512GB NVMe, Full HD Display, neuwertig, 350 Franken"
                disabled={quickEntryState === 'loading'}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-base resize-none"
              />
              <Button
                type="button"
                onClick={handleQuickTextSubmit}
                disabled={!quickText.trim() || quickEntryState === 'loading'}
                className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium"
              >
                {quickEntryState === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>KI analysiert...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Formular ausfuellen</span>
                  </>
                )}
              </Button>
            </div>

            {/* Status feedback */}
            {quickEntryState === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Formular wurde ausgefuellt! Bitte pruefen und ergaenzen.</span>
              </div>
            )}
            {quickEntryState === 'error' && quickEntryError && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{quickEntryError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
