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
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  const t = useTranslations('components.erfassung.dataEntryTabs')

  const CORE_TABS: TabConfig[] = [
    {
      id: 'form',
      label: t('tabTextLabel'),
      icon: <Zap className="w-4 h-4" />,
      description: t('tabTextDesc'),
    },
    {
      id: 'file',
      label: t('tabFileLabel'),
      icon: <FileUp className="w-4 h-4" />,
      description: t('tabFileDesc'),
    },
  ]

  const FUTURE_TABS: TabConfig[] = [
    {
      id: 'speech',
      label: t('tabSpeechLabel'),
      icon: <Mic className="w-4 h-4" />,
      description: t('tabSpeechDesc'),
    },
    {
      id: 'picture',
      label: t('tabPictureLabel'),
      icon: <Camera className="w-4 h-4" />,
      description: t('tabPictureDesc'),
    },
  ]

  const tabs = showAllTabs ? [...CORE_TABS, ...FUTURE_TABS] : CORE_TABS
  const [activeMode, setActiveMode] = useState<EntryMode>(initialMode)
  const [quickText, setQuickText] = useState('')
  const [quickEntryState, setQuickEntryState] = useState<QuickEntryState>('idle')
  const [quickEntryError, setQuickEntryError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [isUploading, setIsUploading] = useState(false)
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([])

  // Sync prop → local state when parent changes the collapsed prop.
  // This is the legitimate "mirror external value" pattern; setState in
  // effect is unavoidable here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsCollapsed(collapsed) }, [collapsed])

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
          throw new Error(result.error || t('processingFailed'))
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
          throw new Error(result.error || t('processingFailed'))
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
  }, [t, quickText, onProductData, onBulkData, onError, onDataFilled])

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
        throw new Error(apiError || t('processingFailed'))
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
  }, [t, onBulkData, onError])

  return (
    <div
      className={`bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 overflow-hidden ${className}`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-primary-100/50 dark:hover:bg-primary-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-action" />
          <span className="font-semibold text-text-primary">{t('quickEntryTitle')}</span>
          {isCollapsed && quickEntryState === 'success' && (
            <span className="text-sm text-action">{t('quickEntryFilled')}</span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-action" />
        ) : (
          <ChevronUp className="w-5 h-5 text-action" />
        )}
      </button>

      {/* Tab headers */}
      {!isCollapsed && tabs.length > 1 && (
        <div className="flex border-b border-t border-primary-200 dark:border-primary-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeMode === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-primary-700 dark:text-primary-300 border-b-2 border-primary-600 -mb-px'
                  : 'text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {!isCollapsed && <div className="p-6">
        {/* Speech mode - Coming soon */}
        {activeMode === 'speech' && (
          <div className="text-center py-8 text-text-tertiary">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('speechComingSoon')}</p>
            <p className="text-sm">{t('speechRequires')}</p>
          </div>
        )}

        {/* Picture mode - Coming soon */}
        {activeMode === 'picture' && (
          <div className="text-center py-8 text-text-tertiary">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('pictureComingSoon')}</p>
            <p className="text-sm">{t('pictureRequires')}</p>
          </div>
        )}

        {/* Form mode with Quick Text Entry */}
        {activeMode === 'form' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <Heading level={3} className="text-lg font-semibold text-text-primary">
                {t('quickEntryTitle')}
              </Heading>
              <p className="text-sm text-text-secondary">
                {t('quickEntryPlaceholder')}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && quickText.trim()) {
                    e.preventDefault()
                    handleQuickTextSubmit()
                  }
                }}
                placeholder={"Dell Latitude E7470 i5 8GB 256GB SSD 280 CHF"}
                disabled={quickEntryState === 'loading'}
                rows={4}
                className="resize-none"
              />
              <Button
                type="button"
                onClick={handleQuickTextSubmit}
                disabled={!quickText.trim() || quickEntryState === 'loading'}
                variant="primary"
                className="w-full sm:w-auto sm:self-end"
              >
                {quickEntryState === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('analyzing')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>{t('fillForm')}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Status feedback */}
            {quickEntryState === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-700 dark:text-primary-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{t('dataFilled')}</span>
              </div>
            )}
            {quickEntryState === 'error' && quickEntryError && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-error-50 dark:bg-error-900/20 rounded-lg text-error-700 dark:text-error-400">
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
              <Heading level={3} className="text-lg font-semibold text-text-primary">
                {t('fileImportTitle')}
              </Heading>
              <p className="text-sm text-text-secondary">
                {t('fileImportDesc')}
              </p>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary-500 mb-2 animate-spin" />
                  <span className="text-sm text-action font-medium">{t('processing')}</span>
                </>
              ) : (
                <>
                  <FileUp className="w-10 h-10 text-primary-400 mb-2" />
                  <span className="text-sm text-text-secondary font-medium">{t('chooseFile')}</span>
                  <span className="text-xs text-text-muted mt-1">{t('fileHint')}</span>
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
              <div className="flex items-start gap-2 py-2 px-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-warning-700 dark:text-warning-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{t('unmappedColumns')}</span>{' '}
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
