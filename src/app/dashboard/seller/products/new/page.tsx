'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Upload,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Zap,
  Info
} from 'lucide-react'

export default function NewProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    images: [] as File[],
    title: '',
    description: '',
    condition: 'good' as 'new' | 'like_new' | 'good' | 'fair',
    category: '',
    price: '',
    location: '',
    useAiAnalysis: true
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 5) {
      alert('Maximal 5 Bilder erlaubt')
      return
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.images.length === 0) {
      setSubmitResult({
        success: false,
        message: 'Bitte laden Sie mindestens ein Bild hoch'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      // First, upload images
      const imageUrls: string[] = []

      for (const image of formData.images) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', image)

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formDataUpload
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrls.push(uploadData.url)
        }
      }

      // Create product data
      const productData = {
        images: imageUrls,
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        category: formData.category,
        price: parseFloat(formData.price) * 100, // Convert to cents
        location: formData.location,
        useAiAnalysis: formData.useAiAnalysis
      }

      // Submit product for AI analysis and inventory creation
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Produkt erfolgreich eingereicht! Es wird von unserer KI analysiert und bald im Shop verfügbar sein.'
        })

        // Reset form
        setFormData({
          images: [],
          title: '',
          description: '',
          condition: 'good',
          category: '',
          price: '',
          location: '',
          useAiAnalysis: true
        })
        setImagePreviews([])

        // Redirect to products list after success
        setTimeout(() => {
          router.push('/dashboard/seller/products')
        }, 3000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Fehler beim Erstellen des Produkts'
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Anmeldung erforderlich</h1>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an, um Produkte zu erstellen.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/seller/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Produkten
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Neues Produkt hinzufügen
            </h1>
            <p className="text-gray-600">
              Fügen Sie Ihr refurbished Produkt hinzu - unsere KI hilft bei der Optimierung
            </p>
          </div>
        </div>

        {submitResult && (
          <div id={submitResult.success ? undefined : 'seller-product-error'} className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {submitResult.success ? (
                <CheckCircle className="w-6 h-6 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 mr-3" />
              )}
              <div>
                <h3 className="font-semibold mb-1">
                  {submitResult.success ? 'Produkt eingereicht!' : 'Fehler'}
                </h3>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Produktbilder *
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length < 5 && (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="mb-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-green-600 hover:text-green-700 font-medium">
                        Bilder auswählen
                      </span>
                      <span className="text-gray-500 ml-1">
                        oder hierhin ziehen
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Bis zu 5 Bilder • Max 10MB pro Bild • JPG, PNG, WebP
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Produktinformationen</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produkttitel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. MacBook Air M1 - Wie neu"
                  required
                  aria-required="true"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Detaillierte Beschreibung des Produkts..."
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="">Kategorie auswählen</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Desktop-PCs">Desktop-PCs</option>
                  <option value="Monitore">Monitore</option>
                  <option value="Zubehör">Zubehör</option>
                  <option value="Netzwerk">Netzwerk</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zustand *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as 'new' | 'like_new' | 'good' | 'fair' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="new">Neu</option>
                  <option value="like_new">Wie neu</option>
                  <option value="good">Gut</option>
                  <option value="fair">Akzeptabel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preis (CHF) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="199.00"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standort *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Zürich, Schweiz"
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Option */}
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    KI-gestützte Optimierung
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Unsere KI analysiert Ihre Produktbilder automatisch und optimiert Titel,
                    Beschreibung und Preise für bessere Verkaufschancen.
                  </p>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ai-analysis"
                      checked={formData.useAiAnalysis}
                      onChange={(e) => setFormData(prev => ({ ...prev, useAiAnalysis: e.target.checked }))}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="ai-analysis" className="text-sm font-medium text-blue-900">
                      KI-Analyse und Optimierung verwenden
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting || formData.images.length === 0}
              className="inline-flex items-center px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Produkt wird analysiert...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 mr-2" />
                  Produkt einreichen
                </>
              )}
            </button>

            <p className="text-sm text-gray-600 mt-4">
              Nach Einreichung wird Ihr Produkt von unserer KI analysiert und für den Verkauf optimiert.
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Was passiert als nächstes?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Ihre Bilder werden hochgeladen und analysiert</li>
                <li>• KI extrahiert Produktdetails automatisch</li>
                <li>• Titel und Beschreibung werden optimiert</li>
                <li>• Produkt wird im RevampIT Marketplace veröffentlicht</li>
                <li>• Sie erhalten Benachrichtigungen über Anfragen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}