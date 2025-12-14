"use client";

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Upload,
  X,
  Zap,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Smartphone,
  Laptop,
  Monitor,
  Headphones,
  HardDrive,
  Router
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductSuggestion {
  id: string
  name: string
  category: string
  estimatedPrice: number
  confidence: number
  brand?: string
  model?: string
  condition: 'new' | 'excellent' | 'good' | 'fair'
  features: string[]
  icon: React.ComponentType<any>
}

interface AICameraProductListingProps {
  onProductDetected: (product: Partial<ProductSuggestion>) => void
  onClose: () => void
}

export default function AICameraProductListing({ onProductDetected, onClose }: AICameraProductListingProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductSuggestion | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock AI analysis results
  const mockAISuggestions: ProductSuggestion[] = [
    {
      id: 'iphone13promax',
      name: 'iPhone 13 Pro Max',
      category: 'Smartphones',
      estimatedPrice: 850,
      confidence: 0.92,
      brand: 'Apple',
      model: 'iPhone 13 Pro Max',
      condition: 'excellent',
      features: ['256GB Speicher', 'Triple-Kamera', 'Pro Motion Display', '5G'],
      icon: Smartphone
    },
    {
      id: 'iphone12promax',
      name: 'iPhone 12 Pro Max',
      category: 'Smartphones',
      estimatedPrice: 650,
      confidence: 0.78,
      brand: 'Apple',
      model: 'iPhone 12 Pro Max',
      condition: 'good',
      features: ['128GB Speicher', 'Triple-Kamera', 'OLED Display', 'Face ID'],
      icon: Smartphone
    },
    {
      id: 'samsungs21',
      name: 'Samsung Galaxy S21',
      category: 'Smartphones',
      estimatedPrice: 450,
      confidence: 0.65,
      brand: 'Samsung',
      model: 'Galaxy S21',
      condition: 'good',
      features: ['128GB Speicher', 'Triple-Kamera', '120Hz Display'],
      icon: Smartphone
    }
  ]

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
      console.error('Error accessing camera:', error)
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
  }, [stopCamera])

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
  }, [])

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Mock AI results - in real implementation, this would call an AI service
    setSuggestions(mockAISuggestions)
    setIsAnalyzing(false)
  }

  const selectProduct = (suggestion: ProductSuggestion) => {
    setSelectedSuggestion(suggestion)

    // Auto-fill the product form with AI-detected data
    onProductDetected({
      title: `${suggestion.brand} ${suggestion.model} - ${getConditionText(suggestion.condition)}`,
      price: suggestion.estimatedPrice,
      category: suggestion.category,
      brand: suggestion.brand,
      condition: suggestion.condition,
      description: generateDescription(suggestion),
      images: capturedImage ? [capturedImage] : []
    })
  }

  const getConditionText = (condition: string) => {
    const conditionMap = {
      new: 'Neu',
      excellent: 'Wie neu',
      good: 'Gut',
      fair: 'Akzeptabel'
    }
    return conditionMap[condition as keyof typeof conditionMap] || condition
  }

  const generateDescription = (product: ProductSuggestion) => {
    return `Automatisch erkannt: ${product.name} in ${getConditionText(product.condition)}em Zustand. Features: ${product.features.join(', ')}. Preisvorschlag basierend auf Marktdaten.`
  }

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      'Smartphones': Smartphone,
      'Laptops': Laptop,
      'Monitore': Monitor,
      'Zubehör': Headphones,
      'Speicher': HardDrive,
      'Netzwerk': Router
    }
    return iconMap[category as keyof typeof iconMap] || Smartphone
  }

  if (selectedSuggestion) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Produkt erkannt!
          </h2>
          <p className="text-gray-600 mb-6">
            {selectedSuggestion.name} wurde erfolgreich identifiziert und das Formular ausgefüllt.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <selectedSuggestion.icon className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">{selectedSuggestion.name}</span>
            </div>
            <p className="text-sm text-gray-600">CHF {selectedSuggestion.estimatedPrice}</p>
            <p className="text-xs text-green-600 mt-1">
              {Math.round(selectedSuggestion.confidence * 100)}% Übereinstimmung
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Formular bearbeiten
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    AI Produkt-Erkennung
                  </h2>
                  <p className="text-sm text-gray-600">
                    Machen Sie ein Foto - wir identifizieren Ihr Produkt automatisch
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!capturedImage ? (
              /* Camera/File Upload Section */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Produkt fotografieren
                  </h3>
                  <p className="text-gray-600">
                    Halten Sie Ihr Produkt in die Kamera - unsere KI erkennt automatisch Marke, Modell und Zustand
                  </p>
                </div>

                {isCapturing ? (
                  /* Camera Live View */
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
                        onClick={capturePhoto}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Foto aufnehmen
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial Options */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
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
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </button>
                  </div>
                )}
              </div>
            ) : isAnalyzing ? (
              /* AI Analysis Loading */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Produkt wird analysiert...
                </h3>
                <p className="text-gray-600">
                  Unsere KI erkennt Marke, Modell und Zustand Ihres Produkts
                </p>
                <div className="mt-6 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              /* AI Results */
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Produkt-Erkennung abgeschlossen!
                  </h3>
                  <p className="text-gray-600">
                    Wählen Sie das erkannteste Produkt aus oder versuchen Sie es mit einem besseren Foto erneut
                  </p>
                </div>

                {/* Captured Image Preview */}
                <div className="flex justify-center mb-6">
                  <img
                    src={capturedImage}
                    alt="Captured product"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>

                {/* Product Suggestions */}
                <div className="space-y-3">
                  {suggestions.map((suggestion) => {
                    const IconComponent = getCategoryIcon(suggestion.category)
                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => selectProduct(suggestion)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <IconComponent className="w-8 h-8 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                              <span className={cn(
                                "px-2 py-1 text-xs rounded-full",
                                suggestion.confidence > 0.8 ? "bg-green-100 text-green-800" :
                                suggestion.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              )}>
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {suggestion.brand} • {getConditionText(suggestion.condition)} • CHF {suggestion.estimatedPrice}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.features.slice(0, 3).map((feature, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCapturedImage(null)
                      setSuggestions([])
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Neues Foto
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Manueller Eintrag
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}



