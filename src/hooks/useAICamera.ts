/**
 * Hook for AI Camera functionality
 * Handles camera capture, file upload, and AI analysis
 */

import { useState, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { MOCK_AI_SUGGESTIONS } from '@/components/marketplace/ai-camera/config'
import type { ProductSuggestion } from '@/components/marketplace/ai-camera/types'

interface UseAICameraReturn {
  // State
  isCapturing: boolean
  capturedImage: string | null
  isAnalyzing: boolean
  suggestions: ProductSuggestion[]

  // Refs - using MutableRefObject for DOM element refs
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>

  // Actions
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => void
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  resetCapture: () => void
}

export function useAICamera(): UseAICameraReturn {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const analyzeImage = useCallback(async (_imageData: string) => {
    setIsAnalyzing(true)

    // Simulate AI analysis delay
    // In production, this would call an AI service
    await new Promise(resolve => setTimeout(resolve, 3000))

    setSuggestions(MOCK_AI_SUGGESTIONS)
    setIsAnalyzing(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (error) {
      logger.error('Error accessing camera', { error })
      alert('Kamera-Zugriff fehlgeschlagen. Bitte erlauben Sie Kamerazugriff.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
        analyzeImage(imageData)
      }
    }
  }, [stopCamera, analyzeImage])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        analyzeImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }, [analyzeImage])

  const resetCapture = useCallback(() => {
    setCapturedImage(null)
    setSuggestions([])
  }, [])

  return {
    isCapturing,
    capturedImage,
    isAnalyzing,
    suggestions,
    videoRef,
    canvasRef,
    fileInputRef,
    startCamera,
    stopCamera,
    capturePhoto,
    handleFileUpload,
    resetCapture
  }
}
