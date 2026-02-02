'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Minus,
  Loader2,
  Sparkles,
  Mic,
  Camera
} from 'lucide-react'

interface ProductFormData {
  title: string
  handle: string
  description: string
  price: string
  comparePrice: string
  cost: string
  sku: string
  barcode: string
  inventory: string
  category: string
  tags: string[]
  images: File[]
  variants: Array<{
    title: string
    sku: string
    price: string
    inventory: string
  }>
}

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Smart entry state
  const [smartQuery, setSmartQuery] = useState('')
  const [isSmartLoading, setIsSmartLoading] = useState(false)
  const [smartError, setSmartError] = useState<string | null>(null)
  const [smartSuccess, setSmartSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    handle: '',
    description: '',
    price: '',
    comparePrice: '',
    cost: '',
    sku: '',
    barcode: '',
    inventory: '0',
    category: '',
    tags: [],
    images: [],
    variants: [{
      title: 'Default Variant',
      sku: '',
      price: '',
      inventory: '0'
    }]
  })

  const categories = [
    'Laptops',
    'Desktop PCs',
    'Monitore',
    'Zubehör',
    'Server',
    'Netzwerk',
    'Software'
  ]

  const handleInputChange = (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => {
    if (field === 'title' && typeof value === 'string' && !formData.handle) {
      // Auto-generate handle from title
      const handle = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, title: value, handle }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value } as ProductFormData))
    }
  }

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setFormData(prev => ({ ...prev, variants: newVariants }))
  }

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        title: '',
        sku: '',
        price: '',
        inventory: '0'
      }]
    }))
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
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

  // Smart entry handler - uses AI to look up product info
  const handleSmartEntry = async () => {
    if (!smartQuery.trim()) {
      setSmartError('Bitte gib einen Produktnamen ein')
      return
    }

    setIsSmartLoading(true)
    setSmartError(null)
    setSmartSuccess(null)

    try {
      const response = await fetch('/api/admin/ai/smart-product-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: smartQuery.trim() }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fehler bei der Produkterkennung')
      }

      const product = result.data.product

      // Generate handle from title if needed
      const handle = product.handle || product.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Build description from specs if available
      let description = product.description || ''
      if (product.specs && product.specs.length > 0) {
        const specsText = product.specs
          .map((s: { key: string; value: string }) => `${s.key}: ${s.value}`)
          .join('\n')
        if (description) {
          description += '\n\nTechnische Daten:\n' + specsText
        }
      }

      // Update form with AI-generated data
      setFormData(prev => ({
        ...prev,
        title: product.title || prev.title,
        handle: handle,
        description: description,
        category: product.category || prev.category,
        tags: product.tags || prev.tags,
        variants: [{
          ...prev.variants[0],
          title: 'Default Variant',
          sku: product.sku || prev.variants[0].sku,
          price: product.price || prev.variants[0].price,
        }]
      }))

      setSmartSuccess(`Produkt erkannt: ${product.title}`)
      setSmartQuery('')

      logger.info('Smart entry completed', {
        product: product.title,
        processingTime: result.data.metadata?.processingTime,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setSmartError(message)
      logger.error('Smart entry failed', { error: message })
    } finally {
      setIsSmartLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare product data for Medusa API
      const productData = {
        title: formData.title,
        handle: formData.handle,
        description: formData.description,
        status: "published",
        is_giftcard: false,
        discountable: true,
        tags: formData.tags.map(tag => ({ value: tag })),
        variants: formData.variants.map(variant => ({
          title: variant.title || 'Default Variant',
          sku: variant.sku || `${formData.handle}-${variant.title}`,
          inventory_quantity: parseInt(variant.inventory) || 0,
          prices: [{
            amount: Math.round(parseFloat(variant.price) * 100), // Convert to cents
            currency_code: "chf"
          }]
        }))
      }

      // Call the admin API to create the product
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      logger.info('Product created successfully', { productId: result.id })

      // Redirect to products list
      router.push('/admin/products')
    } catch (error) {
      logger.error('Error saving product', { error })
      alert(`Error creating product: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Neues Produkt erstellen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fügen Sie ein neues Produkt zum Shop hinzu
          </p>
        </div>
      </div>

      {/* Smart Entry Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Smart Entry
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gib einfach den Produktnamen ein und die KI füllt das Formular aus
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={smartQuery}
              onChange={(e) => {
                setSmartQuery(e.target.value)
                setSmartError(null)
                setSmartSuccess(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSmartLoading) {
                  e.preventDefault()
                  handleSmartEntry()
                }
              }}
              placeholder="z.B. Dell Latitude e7470, ThinkPad T480, MacBook Pro 2019..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSmartLoading}
            />
          </div>
          <button
            type="button"
            onClick={handleSmartEntry}
            disabled={isSmartLoading || !smartQuery.trim()}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {isSmartLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Suche...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Erkennen
              </>
            )}
          </button>
        </div>

        {/* Future input methods - disabled for now */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
            title="Spracheingabe (bald verfügbar)"
          >
            <Mic className="w-4 h-4" />
            Sprache
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
            title="Bilderkennung (bald verfügbar)"
          >
            <Camera className="w-4 h-4" />
            Foto
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center ml-2">
            Sprache & Foto bald verfügbar
          </span>
        </div>

        {/* Status messages */}
        {smartError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{smartError}</p>
          </div>
        )}
        {smartSuccess && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">{smartSuccess}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Grundinformationen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Produktname *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="z.B. Refurbished MacBook Pro 14"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL-Slug *
              </label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="dell-latitude-e7470"
                required
              />
              {formData.handle && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL: /products/{formData.handle}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Kategorie wählen</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Detaillierte Beschreibung des Produkts..."
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Produktbilder
          </h2>

          <div className="space-y-4">
            {/* Image Upload */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="font-medium text-green-600 hover:text-green-500">
                    Dateien auswählen
                  </span>
                  <span> oder hierhin ziehen</span>
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
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF bis zu 10MB
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Produktvarianten
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Variante hinzufügen
            </button>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Variante {index + 1}
                  </h3>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="z.B. 16GB RAM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="MBP14-16GB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preis (CHF)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="1299.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lager
                    </label>
                    <input
                      type="number"
                      value={variant.inventory}
                      onChange={(e) => handleVariantChange(index, 'inventory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Speichere...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Produkt erstellen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}






