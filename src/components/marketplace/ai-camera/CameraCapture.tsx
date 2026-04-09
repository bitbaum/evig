"use client"

/**
 * Camera capture UI - live view and capture controls
 */

import { Camera, Upload } from 'lucide-react'
import Heading from '@/components/ui/Heading'

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
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">
          Produkt fotografieren
        </Heading>
        <p className="text-gray-600">
          Halte dein Produkt in die Kamera - unsere KI erkennt automatisch Marke, Modell und Zustand
        </p>
      </div>

      {isCapturing ? (
        <CameraLiveView
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={onCapturePhoto}
          onCancel={onStopCamera}
        />
      ) : (
        <CameraOptions
          fileInputRef={fileInputRef}
          onStartCamera={onStartCamera}
          onFileUpload={onFileUpload}
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
}

function CameraLiveView({ videoRef, canvasRef, onCapture, onCancel }: CameraLiveViewProps) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCapture}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Foto aufnehmen
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

interface CameraOptionsProps {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>
  onStartCamera: () => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

function CameraOptions({ fileInputRef, onStartCamera, onFileUpload }: CameraOptionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onStartCamera}
        className="p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
      >
        <Camera className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <div className="font-medium text-gray-900">Kamera öffnen</div>
        <div className="text-sm text-gray-600 mt-1">Live-Foto aufnehmen</div>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-6 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
      >
        <Upload className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <div className="font-medium text-gray-900">Datei hochladen</div>
        <div className="text-sm text-gray-600 mt-1">Vorhandenes Foto verwenden</div>
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
