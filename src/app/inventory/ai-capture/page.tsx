'use client'

import Image from 'next/image'
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap,
  Leaf,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { useAICapture, getConfidenceColor } from '@/hooks/useAICapture'

export default function AICapturePage() {
  const {
    image,
    isAnalyzing,
    analysis,
    sustainabilityScore,
    error,
    isSaving,
    savedProductId,
    fileInputRef,
    cameraInputRef,
    handleFileSelect,
    handleCameraCapture,
    analyzeImage,
    saveProduct,
    resetCapture,
  } = useAICapture()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            KI-gestützte Produkt-Erfassung
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mach ein Foto deines Produkts und lass die KI die Details extrahieren
          </p>
        </div>

        {/* Image Capture Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          {!image ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 mb-6">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Produkt foto aufnehmen
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Verwende deine Kamera oder wähle ein Bild aus deiner Galerie
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleCameraCapture} className="gap-2 px-6 py-3">
                    <Camera className="w-5 h-5" />
                    Kamera
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2 px-6 py-3">
                    <Upload className="w-5 h-5" />
                    Datei wählen
                  </Button>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="relative">
                <Image
                  src={image}
                  alt="Product preview"
                  width={400}
                  height={300}
                  className="w-full max-w-md mx-auto rounded-lg object-cover"
                />
                <button
                  onClick={resetCapture}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Analysis Button */}
              {!analysis && !isAnalyzing && (
                <div className="text-center">
                  <Button onClick={analyzeImage} variant="primary" className="gap-2 px-8 py-3">
                    <Zap className="w-5 h-5" />
                    Mit KI analysieren
                  </Button>
                </div>
              )}

              {/* Analysis Loading */}
              {isAnalyzing && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    KI analysiert dein Produkt...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Erkannte Produktinformationen
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Produktname
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {analysis.product_name}
                      </span>
                      <span className={`text-sm ${getConfidenceColor(analysis.product_name_confidence)}`}>
                        ({Math.round(analysis.product_name_confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marke
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">{analysis.brand}</span>
                      <span className={`text-sm ${getConfidenceColor(analysis.brand_confidence)}`}>
                        ({Math.round(analysis.brand_confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategorie
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">{analysis.category}</span>
                      <span className={`text-sm ${getConfidenceColor(analysis.category_confidence)}`}>
                        ({Math.round(analysis.category_confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Zustand
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionBadge(analysis.condition).color}`}>
                      {getConditionBadge(analysis.condition).label}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Geschätzter Preis
                    </label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        CHF {analysis.estimated_price_chf}
                      </span>
                      <span className={`text-sm ${getConfidenceColor(analysis.price_confidence)}`}>
                        ({Math.round(analysis.price_confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  {analysis.color && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Farbe
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white">{analysis.color}</span>
                        <span className={`text-sm ${getConfidenceColor(analysis.color_confidence)}`}>
                          ({Math.round(analysis.color_confidence * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      KI-Konfidenz Gesamt
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analysis.total_confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(analysis.total_confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sustainability Score */}
            {sustainabilityScore && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Leaf className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Nachhaltigkeits-Score
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {sustainabilityScore.overall_score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Gesamt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-blue-600 mb-1">
                      {sustainabilityScore.environmental_score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Umwelt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-purple-600 mb-1">
                      {sustainabilityScore.social_score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sozial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-orange-600 mb-1">
                      {sustainabilityScore.economic_score}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Wirtschaft</div>
                  </div>
                </div>

                {sustainabilityScore.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Empfehlungen
                    </h3>
                    <ul className="space-y-2">
                      {sustainabilityScore.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex gap-4 justify-center">
                {savedProductId ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-medium mb-2">
                      Produkt erfolgreich gespeichert!
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Weiterleitung zur Produktübersicht...
                    </p>
                  </div>
                ) : (
                  <>
                    <Button onClick={resetCapture} variant="outline" className="gap-2 px-6 py-3">
                      <RefreshCw className="w-5 h-5" />
                      Neu aufnehmen
                    </Button>
                    <Button onClick={saveProduct} disabled={isSaving} className="gap-2 px-8 py-3">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Speichere...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Produkt speichern
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
