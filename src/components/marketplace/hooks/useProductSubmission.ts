/**
 * useProductSubmission Hook
 * 
 * Handles product submission to backend API
 * Ensures proper data transformation and error handling
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created hook for product submission with proper API integration
 */

import { useState } from 'react'
import { ProductFormData } from '../types'

interface SubmissionResult {
  success: boolean
  message: string
  inventoryId?: string
  aiProductId?: string
  error?: string
}

/**
 * Hook for submitting product listings
 */
export function useProductSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitProduct = async (
    formData: ProductFormData,
    imageFiles: File[]
  ): Promise<SubmissionResult> => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Step 1: Upload images
      let imageUrls: string[] = []
      
      if (imageFiles.length > 0) {
        const uploadFormData = new FormData()
        imageFiles.forEach((file) => {
          uploadFormData.append('files', file)
        })

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json().catch(() => ({}))
          throw new Error(uploadError.error || 'Bild-Upload fehlgeschlagen')
        }

        const uploadData = await uploadResponse.json()
        // API returns { ok: true, urls: [...] }
        imageUrls = uploadData.urls || []
        
        if (imageUrls.length === 0) {
          throw new Error('Keine Bilder wurden hochgeladen')
        }
      } else {
        throw new Error('Mindestens ein Bild ist erforderlich')
      }

      // Step 2: Convert price to cents (API expects price in cents)
      const priceInCents = Math.round(parseFloat(formData.price) * 100)
      if (isNaN(priceInCents) || priceInCents <= 0) {
        throw new Error('Ungültiger Preis')
      }

      // Step 3: Submit product to API
      const productData = {
        images: imageUrls, // Array of image URLs
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        category: formData.category,
        price: priceInCents, // Price in cents
        location: formData.location,
        useAiAnalysis: false, // Can be made configurable later
      }

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Produktanlage fehlgeschlagen')
      }

      if (!data.success) {
        throw new Error(data.message || 'Unbekannter Fehler')
      }

      return {
        success: true,
        message: data.message || 'Produkt erfolgreich eingereicht!',
        inventoryId: data.inventoryId,
        aiProductId: data.aiProductId,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    submitProduct,
    isSubmitting,
    error,
  }
}



