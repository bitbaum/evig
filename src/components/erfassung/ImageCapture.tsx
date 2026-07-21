'use client'

/**
 * ImageCapture Component
 *
 * Picture upload and camera capture for product data entry.
 * Supports:
 * - File upload (drag & drop or click)
 * - Camera capture (mobile-first)
 * - AI analysis for form prefill
 *
 * Usage:
 *   <ImageCapture
 *     onImageCapture={(base64) => setImage(base64)}
 *     onAnalysisComplete={(data) => fillForm(data)}
 *   />
 */

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Camera,
  Upload,
  X,
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useProductAnalysis } from '@/hooks/useProductAnalysis'
import { downscaleImage } from '@/lib/images/downscale'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'

interface ImageCaptureProps {
  onImageCapture: (imageBase64: string) => void
  onAnalysisComplete?: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

type CaptureState = 'idle' | 'preview' | 'analyzing' | 'success' | 'error'

export function ImageCapture({
  onImageCapture,
  onAnalysisComplete,
  onError,
  disabled = false,
  className = '',
}: ImageCaptureProps) {
  const t = useTranslations('components.erfassung.imageCapture')
  const { isAnalyzing, error: analysisError, analyzeProduct } = useProductAnalysis()
  const [state, setState] = useState<CaptureState>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection — downscale before anything else so a 10 MB phone
  // photo never reaches the network or the vision provider at full size.
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(t('errorImageOnly'))
        setState('error')
        return
      }

      try {
        const base64 = await downscaleImage(file)
        if (!base64) {
          setErrorMessage(t('errorReadFile'))
          setState('error')
          onError?.(t('errorReadFile'))
          return
        }
        setErrorMessage(null)
        setImagePreview(base64)
        setState('preview')
        onImageCapture(base64)
      } catch {
        setErrorMessage(t('errorReadFile'))
        setState('error')
        onError?.(t('errorReadFile'))
      }
    },
    [t, onImageCapture, onError]
  )

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  // Clear image and reset
  const clearImage = useCallback(() => {
    setImagePreview(null)
    setErrorMessage(null)
    setState('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [])

  // Analyze with AI
  const analyzeWithAI = useCallback(async () => {
    if (!imagePreview) return

    setState('analyzing')
    setErrorMessage(null)

    const result = await analyzeProduct(imagePreview)

    if (result) {
      onAnalysisComplete?.(result.formData, result.metadata)
      setState('success')

      // Reset to preview after 2 seconds
      setTimeout(() => {
        setState('preview')
      }, 2000)
    } else {
      // Non-destructive: keep the photo in preview and surface the (actionable)
      // provider message inline, so the operator can retry or switch to text
      // without re-taking the picture.
      setErrorMessage(analysisError || t('errorAnalysis'))
      setState('preview')
      onError?.(analysisError || t('errorAnalysis'))
    }
  }, [t, imagePreview, analyzeProduct, analysisError, onAnalysisComplete, onError])

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main capture area */}
      <div className="card-shell p-4 sm:p-6">
        {/* Idle state: Upload area */}
        {state === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-action bg-action-muted'
                : 'border-default'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-text-tertiary" />
              </div>

              <div>
                <p className="text-text-secondary mb-2">
                  {t('dragOrText')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {t('chooseFile')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {t('camera')}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                {t('fileHint')}
              </p>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Preview state: Show image with analyze button */}
        {(state === 'preview' ||
          state === 'analyzing' ||
          state === 'success') &&
          imagePreview && (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <div className="relative w-full aspect-video bg-surface-raised rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt={t('imageAlt')}
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={clearImage}
                  disabled={state === 'analyzing'}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-xs"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Inline, non-destructive analysis error — the photo stays put. */}
              {state === 'preview' && errorMessage && (
                <div className="flex items-start gap-2 py-2 px-3 bg-error-50 dark:bg-error-900/20 rounded-lg text-error-700 dark:text-error-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3">
                {state === 'preview' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {t('changeImage')}
                    </Button>
                    <Button
                      type="button"
                      onClick={analyzeWithAI}
                      variant="primary"
                    >
                      <Zap className="w-4 h-4" />
                      {errorMessage ? t('retry') : t('analyzeWithAI')}
                    </Button>
                  </>
                )}

                {state === 'analyzing' && (
                  <div className="flex items-center gap-2 text-action">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('analyzing')}</span>
                  </div>
                )}

                {state === 'success' && (
                  <div className="flex items-center gap-2 text-action">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t('success')}</span>
                  </div>
                )}
              </div>

              {/* Hidden file input for change image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

        {/* Error state */}
        {state === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-error-600" />
            </div>
            <p className="text-error-600 dark:text-error-400 mb-4">
              {errorMessage || t('errorGeneric')}
            </p>
            <Button type="button" variant="outline" onClick={clearImage}>
              {t('retry')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
