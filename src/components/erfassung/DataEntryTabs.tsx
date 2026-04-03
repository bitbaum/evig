'use client'

/**
 * DataEntryTabs Component
 *
 * Multi-mode data entry UI for product capture:
 * - Text (Formular): Quick text → AI extraction → Form prefill (single or bulk)
 * - File (Datei): CSV upload → parsed products → bulk table
 * - Speech (Sprache): Voice recording → AI extraction (future)
 * - Picture (Bild): Photo/upload → AI analysis (future)
 *
 * Auto-detects single vs bulk: paste one product → single form. Paste many → bulk table.
 */

import { useState, useCallback, useEffect } from 'react'
import { Mic, Camera, Zap, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { detectMultipleProducts } from '@/lib/erfassung/detect-multi'
import type { VoiceProductData, ErfassungFormData, AIFieldMetadata, BulkProduct } from '@/types/erfassung'

export type EntryMode = 'speech' | 'picture' | 'form' | 'file'

interface DataEntryTabsProps {
  onProductData: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void
  onBulkData?: (products: BulkProduct[]) => void
  onImageCapture?: (imageBase64: string) => void
  onError?: (error: string) => void
  onDataFilled?: () => void
  activeMode?: EntryMode
  className?: string
  showAllTabs?: boolean
  collapsed?: boolean
}

interface TabConfig {
  id: EntryMode
  label: string
  icon: React.ReactNode
  description: string
}

const CORE_TABS: TabConfig[] = [
  {
    id: 'form',
    label: 'Text',
    icon: <Zap className="w-4 h-4" />,
    description: 'Produktinfos eingeben, KI füllt aus',
  },
  {
    id: 'file',
    label: 'Datei',
    icon: <FileUp className="w-4 h-4" />,
    description: 'CSV-Datei hochladen',
  },
]

const FUTURE_TABS: TabConfig[] = [
  {
    id: 'speech',
    label: 'Sprache',
    icon: <Mic className="w-4 h-4" />,
    description: 'Produkte per Sprache erfassen',
  },
  {
    id: 'picture',
    label: 'Bild',
    icon: <Camera className="w-4 h-4" />,
    description: 'Produkte per Foto erfassen',
  },
]

type QuickEntryState = 'idle' | 'loading' | 'success' | 'error'

export function DataEntryTabs({
  onProductData,
  onBulkData,
  onImageCapture,
  onError,
  onDataFilled,
  activeMode: initialMode = 'form',
  className = '',
  showAllTabs = false,
  collapsed = false,
}: DataEntryTabsProps) {
  const tabs = showAllTabs ? [...CORE_TABS, ...FUTURE_TABS] : CORE_TABS
  const [activeMode, setActiveMode] = useState<EntryMode>(initialMode)
  const [quickText, setQuickText] = useState('')
  const [quickEntryState, setQuickEntryState] = useState<QuickEntryState>('idle')
  const [quickEntryError, setQuickEntryError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [isUploading, setIsUploading] = useState(false)
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([])

  useEffect(() => {
    setIsCollapsed(collapsed)
  }, [collapsed])

  // Handle voice transcription complete
  const handleVoiceData = useCallback(
    (data: VoiceProductData, metadata?: AIFieldMetadata) => {
      logger.info('Voice data received', { product: data.produktname })
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

  // Handle quick text entry with AI — auto-detects single vs multi
  const handleQuickTextSubmit = useCallback(async () => {
    if (!quickText.trim()) return

    setQuickEntryState('loading')
    setQuickEntryError(null)

    try {
      const isMulti = detectMultipleProducts(quickText)

      if (isMulti && onBulkData) {
        // Multi-product: call bulk-text API
        const result = await apiFetch<{ products: BulkProduct[]; productCount: number }>('/api/admin/erfassung/bulk-text', {
          method: 'POST',
          body: { text: quickText },
        })

        if (!result.success) {
          throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
        }

        onBulkData(result.data!.products)
        setQuickEntryState('success')
        logger.info('Bulk text entry successful', { count: result.data!.productCount })

        setTimeout(() => {
          setQuickEntryState('idle')
          setQuickText('')
          setIsCollapsed(true)
        }, 1500)
      } else {
        // Single product: call existing text API
        const result = await apiFetch<{ data: Partial<ErfassungFormData>; metadata: AIFieldMetadata }>('/api/admin/erfassung/text', {
          method: 'POST',
          body: { text: quickText },
        })

        if (!result.success) {
          throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
        }

        const productData = result.data!.data
        const formData: Partial<ErfassungFormData> = {
          hersteller: productData.hersteller,
          produktname: productData.produktname,
          kurzbeschreibung: productData.kurzbeschreibung,
          specs: productData.specs,
          verkaufspreis: productData.verkaufspreis,
          zustand: productData.zustand,
          hauptkategorie: productData.hauptkategorie,
          unterkategorie: productData.unterkategorie,
          kundenprofile: productData.kundenprofile,
        }

        onProductData(formData, result.data!.metadata as AIFieldMetadata)
        setQuickEntryState('success')
        logger.info('Quick text entry successful', { product: productData.produktname })

        setTimeout(() => {
          setQuickEntryState('idle')
          setQuickText('')
          setIsCollapsed(true)
          onDataFilled?.()
        }, 1500)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setQuickEntryError(message)
      setQuickEntryState('error')
      onError?.(message)
      logger.error('Quick text entry failed', { error })
    }
  }, [quickText, onProductData, onBulkData, onError, onDataFilled])

  // Handle CSV file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!onBulkData) return
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: result, error: apiError } = await apiFetch<{ products: BulkProduct[]; unmappedColumns?: string[] }>('/api/admin/erfassung/bulk-upload', {
        method: 'POST',
        body: formData,
        formData: true,
      })

      if (apiError || !result) {
        throw new Error(apiError || 'Datei konnte nicht verarbeitet werden')
      }

      onBulkData(result.products)
      setUnmappedColumns(result.unmappedColumns || [])
      setIsCollapsed(true)
      logger.info('File upload successful', { count: result.products.length, unmappedColumns: result.unmappedColumns })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      onError?.(message)
      logger.error('CSV upload failed', { error })
    } finally {
      setIsUploading(false)
    }
  }, [onBulkData, onError])

  return (
    <div
      className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden ${className}`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-purple-100/50 dark:hover:bg-purple-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-gray-900 dark:text-white">KI-Schnelleingabe</span>
          {isCollapsed && quickEntryState === 'success' && (
            <span className="text-sm text-green-600 dark:text-green-400">(Ausgefüllt)</span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Tab headers */}
      {!isCollapsed && tabs.length > 1 && (
        <div className="flex border-b border-t border-purple-200 dark:border-purple-800">
          {tabs.map((tab) => (
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
      {!isCollapsed && <div className="p-6">
        {/* Speech mode - Coming soon */}
        {activeMode === 'speech' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Spracherfassung kommt bald</p>
            <p className="text-sm">Erfordert selbst-gehosteten Transkriptionsdienst</p>
          </div>
        )}

        {/* Picture mode - Coming soon */}
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
                Ein Produkt oder mehrere auf einmal — die KI erkennt es automatisch
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
                placeholder={"Ein Produkt:\nDell Latitude E7470 i5 8GB 256GB SSD guter Zustand 280 CHF\n\nOder mehrere:\nLenovo ThinkPad T480 i5 8GB 256GB SSD 299\nDell Latitude 5490 i7 16GB 512GB 449\nHP EliteBook 840 G5 i5 8GB 256GB 199"}
                disabled={quickEntryState === 'loading'}
                rows={4}
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
                    <span>Formular ausfüllen</span>
                  </>
                )}
              </Button>
            </div>

            {/* Status feedback */}
            {quickEntryState === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Daten wurden verarbeitet! Bitte prüfen und ergänzen.</span>
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

        {/* File upload mode */}
        {activeMode === 'file' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Datei-Import
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lade eine CSV- oder Excel-Datei mit Produktdaten hoch
              </p>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-purple-500 mb-2 animate-spin" />
                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Wird verarbeitet...</span>
                </>
              ) : (
                <>
                  <FileUp className="w-10 h-10 text-purple-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">CSV- oder Excel-Datei wählen oder hierher ziehen</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">CSV, TSV, XLSX — Spalten werden automatisch erkannt</span>
                </>
              )}
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
            </label>

            {unmappedColumns.length > 0 && (
              <div className="flex items-start gap-2 py-2 px-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Nicht zugeordnete Spalten:</span>{' '}
                  {unmappedColumns.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>}
    </div>
  )
}
