'use client'

/**
 * DataEntryTabs Component
 *
 * Multi-mode data entry UI for product capture:
 * - Text (Formular): Quick text → AI extraction → Form prefill (single or bulk)
 * - File (Datei): CSV upload → parsed products → bulk table
 * - Speech (Sprache): Voice recording → transcription → AI extraction
 * - Picture (Bild): Photo/upload → AI analysis
 *
 * Auto-detects single vs bulk: paste one product → single form. Paste many → bulk table.
 */

import { useState, useCallback, useEffect } from 'react'
import { Mic, Camera, Zap, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, FileUp, PencilLine, Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { detectMultipleProducts } from '@/lib/erfassung/detect-multi'
import { VoiceEntry } from './VoiceEntry'
import { ImageCapture } from './ImageCapture'
import type { ErfassungFormData, AIFieldMetadata, BulkProduct } from '@/types/erfassung'

export type EntryMode = 'speech' | 'picture' | 'form' | 'file'

interface DataEntryTabsProps {
  onProductData: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void
  onBulkData?: (products: BulkProduct[]) => void
  onImageCapture?: (imageBase64: string) => void
  onError?: (error: string) => void
  onDataFilled?: () => void
  onManualEntry?: () => void
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
  onManualEntry,
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
      id: 'picture',
      label: t('tabPictureLabel'),
      icon: <Camera className="w-4 h-4" />,
      description: t('tabPictureDesc'),
    },
    {
      id: 'file',
      label: t('tabFileLabel'),
      icon: <FileUp className="w-4 h-4" />,
      description: t('tabFileDesc'),
    },
    {
      id: 'speech',
      label: t('tabSpeechLabel'),
      icon: <Mic className="w-4 h-4" />,
      description: t('tabSpeechDesc'),
    },
  ]

  const tabs = showAllTabs ? CORE_TABS : CORE_TABS.filter(tab => tab.id === 'form' || tab.id === 'file')
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
        setIsCollapsed(true)
        logger.info('Bulk text entry successful', { count: result.data!.productCount })

        setTimeout(() => {
          setQuickEntryState('idle')
          setQuickText('')
        }, 800)
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
        setIsCollapsed(true)
        onDataFilled?.()
        logger.info('Quick text entry successful', { product: productData.produktname })

        setTimeout(() => {
          setQuickEntryState('idle')
          setQuickText('')
        }, 800)
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
      className={`overflow-hidden rounded-xl border border-default bg-surface-base ${className}`}
    >
      {/* Collapsible header */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex h-auto w-full items-center justify-between rounded-none px-4 py-3 hover:bg-surface-raised sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3 text-left">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-action-text">1</span>
          <span className="min-w-0">
            <span className="block font-semibold text-text-primary">{t('stepTitle')}</span>
            <span className="hidden text-xs font-normal text-text-tertiary sm:block">{t('stepDescription')}</span>
          </span>
          {isCollapsed && quickEntryState === 'success' && (
            <span className="text-sm text-action">{t('quickEntryFilled')}</span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        )}
      </Button>

      {/* Tab headers */}
      {!isCollapsed && tabs.length > 1 && (
        <div className="grid grid-cols-4 border-y border-subtle bg-surface-raised">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              onClick={() => setActiveMode(tab.id)}
              className={`flex h-auto min-w-0 flex-col items-center justify-center gap-1 rounded-none px-1 py-2 text-xs font-medium sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm ${
                activeMode === tab.id
                  ? 'border-b-2 border-action bg-surface-base text-action'
                  : 'text-text-secondary hover:bg-surface-base hover:text-text-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {!isCollapsed && <div className="p-4 sm:p-5">
        <p className="mb-4 text-sm text-text-secondary">
          {tabs.find(tab => tab.id === activeMode)?.description}
        </p>
        {/* Speech mode — record → transcribe → extract (VoiceEntry composes
            useVoiceRecording + useVoiceProduct; posts to /api/admin/erfassung/voice) */}
        {activeMode === 'speech' && (
          <VoiceEntry
            onProductData={onProductData}
            onError={onError}
            onDataFilled={onDataFilled}
          />
        )}

        {/* Picture mode — photo/upload → vision analysis → form prefill */}
        {activeMode === 'picture' && (
          <ImageCapture
            onImageCapture={handleImageCapture}
            onAnalysisComplete={(data) => {
              onProductData(data)
              onDataFilled?.()
            }}
            onError={onError}
          />
        )}

        {/* Form mode with Quick Text Entry */}
        {activeMode === 'form' && (
          <div className="space-y-4">
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
                placeholder={t('exampleInput')}
                disabled={quickEntryState === 'loading'}
                rows={3}
                className="resize-none"
              />
              {/* Discoverability: the multi-product path is otherwise invisible —
                  you only find it by accidentally pasting several lines. */}
              <p className="flex items-start gap-1.5 text-xs text-text-tertiary">
                <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('multiProductHint')}</span>
              </p>
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
              {onManualEntry && (
                <Button
                  type="button"
                  onClick={onManualEntry}
                  variant="ghost"
                  className="w-full gap-2 text-text-secondary sm:w-auto sm:self-end"
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  <span>{t('manualEntry')}</span>
                </Button>
              )}
            </div>

            {/* Status feedback */}
            {quickEntryState === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-action-muted rounded-lg text-action">
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
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-strong dark:border-action rounded-xl cursor-pointer hover:border-action hover:bg-action-muted transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-action mb-2 animate-spin" />
                  <span className="text-sm text-action font-medium">{t('processing')}</span>
                </>
              ) : (
                <>
                  <FileUp className="w-10 h-10 text-action mb-2" />
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
