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
import type { ErfassungFormData } from '@/types/erfassung'

interface ImageCaptureProps {
  onImageCapture: (imageBase64: string) => void
  onAnalysisComplete?: (data: Partial<ErfassungFormData>) => void
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

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(t('errorImageOnly'))
        setState('error')
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string
        setImagePreview(base64)
        setState('preview')
        onImageCapture(base64)
      }
      reader.onerror = () => {
        setErrorMessage(t('errorReadFile'))
        setState('error')
        onError?.(t('errorReadFile'))
      }
      reader.readAsDataURL(file)
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
      onAnalysisComplete?.(result.formData)
      setState('success')

      // Reset to preview after 2 seconds
      setTimeout(() => {
        setState('preview')
      }, 2000)
    } else {
      setErrorMessage(analysisError || t('errorAnalysis'))
      setState('error')
      onError?.(analysisError || t('errorAnalysis'))
    }
  }, [t, imagePreview, analyzeProduct, analysisError, onAnalysisComplete, onError])

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main capture area */}
      <div className="card-shell p-6">
        {/* Idle state: Upload area */}
        {state === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-action bg-action-muted-muted'
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
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={state === 'analyzing'}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-error-600 hover:bg-error-700 disabled:bg-error-400 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                      {t('analyzeWithAI')}
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
