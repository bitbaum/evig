"use client"

/**
 * Camera capture UI - live view and capture controls
 */

import { Camera, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface CameraCaptureProps {
  isCapturing: boolean
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  onStartCamera: () => void
  onStopCamera: () => void
  onCapturePhoto: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function CameraCapture({
  isCapturing,
  videoRef,
  canvasRef,
  fileInputRef,
  onStartCamera,
  onStopCamera,
  onCapturePhoto,
  onFileUpload
}: CameraCaptureProps) {
  const t = useTranslations('components.cameraCapture')
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-action" />
        </div>
        <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
          {t('title')}
        </Heading>
        <p className="text-text-secondary">
          {t('subtitle')}
        </p>
      </div>

      {isCapturing ? (
        <CameraLiveView
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={onCapturePhoto}
          onCancel={onStopCamera}
          labelTakePhoto={t('takePhoto')}
          labelCancel={t('cancel')}
        />
      ) : (
        <CameraOptions
          fileInputRef={fileInputRef}
          onStartCamera={onStartCamera}
          onFileUpload={onFileUpload}
          labelOpenCamera={t('openCamera')}
          labelLivePhoto={t('livePhoto')}
          labelUploadFile={t('uploadFile')}
          labelUseExisting={t('useExisting')}
        />
      )}
    </div>
  )
}

interface CameraLiveViewProps {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  onCapture: () => void
  onCancel: () => void
  labelTakePhoto: string
  labelCancel: string
}

function CameraLiveView({ videoRef, canvasRef, onCapture, onCancel, labelTakePhoto, labelCancel }: CameraLiveViewProps) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-surface-raised">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-3">
        <Button onClick={onCapture} variant="primary" className="flex-1">
          <Camera className="w-5 h-5" />
          {labelTakePhoto}
        </Button>
        <Button onClick={onCancel} variant="outline">
          {labelCancel}
        </Button>
      </div>
    </div>
  )
}

interface CameraOptionsProps {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  onStartCamera: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  labelOpenCamera: string
  labelLivePhoto: string
  labelUploadFile: string
  labelUseExisting: string
}

function CameraOptions({ fileInputRef, onStartCamera, onFileUpload, labelOpenCamera, labelLivePhoto, labelUploadFile, labelUseExisting }: CameraOptionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onStartCamera}
        className="p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
      >
        <Camera className="w-12 h-12 text-action mx-auto mb-3" />
        <div className="font-medium text-text-primary">{labelOpenCamera}</div>
        <div className="text-sm text-text-secondary mt-1">{labelLivePhoto}</div>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
      >
        <Upload className="w-12 h-12 text-action mx-auto mb-3" />
        <div className="font-medium text-text-primary">{labelUploadFile}</div>
        <div className="text-sm text-text-secondary mt-1">{labelUseExisting}</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="hidden"
        />
      </button>
    </div>
  )
}
