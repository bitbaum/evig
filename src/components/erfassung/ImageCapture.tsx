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
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
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
        setErrorMessage('Bitte nur Bildateien hochladen')
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
        setErrorMessage('Fehler beim Lesen der Datei')
        setState('error')
        onError?.('Fehler beim Lesen der Datei')
      }
      reader.readAsDataURL(file)
    },
    [onImageCapture, onError]
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

    try {
      const response = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview, saveToDatabase: false }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analyse fehlgeschlagen')
      }

      if (result.success && result.analysis) {
        const a = result.analysis
        const formData: Partial<ErfassungFormData> = {
          hersteller: a.brand || '',
          produktname: a.product_name || '',
          zustand: a.condition || '',
          verkaufspreis: a.estimated_price_chf?.toString() || '',
        }

        onAnalysisComplete?.(formData)
        setState('success')

        logger.info('Image analysis completed', { product: a.product_name })

        // Reset to preview after 2 seconds
        setTimeout(() => {
          setState('preview')
        }, 2000)
      } else {
        throw new Error('Keine Analysedaten erhalten')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Analyse fehlgeschlagen'
      logger.error('Image analysis failed', { error })
      setErrorMessage(message)
      setState('error')
      onError?.(message)
    }
  }, [imagePreview, onAnalysisComplete, onError])

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main capture area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Idle state: Upload area */}
        {state === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Bild hierhin ziehen oder
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
                    Datei wählen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Kamera
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-500">
                JPG, PNG, WebP bis 10 MB
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
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Produktbild Vorschau"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={state === 'analyzing'}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full flex items-center justify-center shadow-lg"
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
                      Anderes Bild
                    </Button>
                    <Button
                      type="button"
                      onClick={analyzeWithAI}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Zap className="w-4 h-4" />
                      Mit KI ausfüllen
                    </Button>
                  </>
                )}

                {state === 'analyzing' && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analysiere Bild...</span>
                  </div>
                )}

                {state === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Formular wurde ausgefüllt!</span>
                  </div>
                )}
              </div>

              {/* Hidden file input for "Anderes Bild" */}
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
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {errorMessage || 'Ein Fehler ist aufgetreten'}
            </p>
            <Button type="button" variant="outline" onClick={clearImage}>
              Erneut versuchen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
