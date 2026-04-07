'use client'

import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useProductForm,
  useSmartEntry,
  SmartEntrySection,
  ProductBasicInfoSection,
  ProductImageUpload,
  ProductVariantsSection,
} from '@/components/admin/products/product-form'

export default function NewProductPage() {
  const {
    formData,
    isLoading,
    imagePreviews,
    handleInputChange,
    handleVariantChange,
    addVariant,
    removeVariant,
    handleImageUpload,
    removeImage,
    setFormData,
    handleSubmit,
  } = useProductForm()

  const {
    smartQuery,
    isSmartLoading,
    smartError,
    smartSuccess,
    setSmartQuery,
    handleSmartEntry,
  } = useSmartEntry(setFormData)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neues Produkt erstellen</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Fügen Sie ein neues Produkt zum Shop hinzu</p>
        </div>
      </div>

      <SmartEntrySection
        query={smartQuery}
        isLoading={isSmartLoading}
        error={smartError}
        success={smartSuccess}
        onQueryChange={setSmartQuery}
        onSubmit={handleSmartEntry}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <ProductBasicInfoSection formData={formData} onInputChange={handleInputChange} />
        <ProductImageUpload imagePreviews={imagePreviews} onImageUpload={handleImageUpload} onRemoveImage={removeImage} />
        <ProductVariantsSection
          variants={formData.variants}
          onVariantChange={handleVariantChange}
          onAdd={addVariant}
          onRemove={removeVariant}
        />

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Abbrechen
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-2 px-6 py-3 font-semibold"
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
          </Button>
        </div>
      </form>
    </div>
  )
}
