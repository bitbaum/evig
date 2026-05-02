/**
 * useProductForm Hook
 * 
 * Custom hook for product form state management
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted form state management from ProductListingForm
 */

import { useState } from 'react'
import { ProductFormData, ProductListingErrors } from '../types'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'

function validateProductForm(formData: ProductFormData): ProductListingErrors {
  const errors: ProductListingErrors = {}
  if (!formData.title.trim()) errors.title = 'Titel ist erforderlich'
  if (!formData.description.trim()) errors.description = 'Beschreibung ist erforderlich'
  if (!formData.price.trim()) errors.price = 'Preis ist erforderlich'
  if (!formData.category) errors.category = 'Kategorie ist erforderlich'
  if (!formData.condition) errors.condition = 'Zustand ist erforderlich'
  if (!formData.location.trim()) errors.location = 'Standort ist erforderlich'
  return errors
}

function isFormValid(errors: ProductListingErrors): boolean {
  return Object.keys(errors).length === 0
}

const initialFormData: ProductFormData = {
  title: '',
  description: '',
  price: '',
  category: '',
  brand: '',
  condition: '',
  images: [],
  location: '',
  contactInfo: '',
}

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<ProductListingErrors>({})

  const updateField = (field: keyof ProductFormData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field as keyof ProductListingErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof ProductListingErrors]
        return newErrors
      })
    }
  }

  const addImages = (files: File[]) => {
    if (formData.images.length + files.length > MARKETPLACE_LIMITS.MAX_IMAGES) {
      throw new Error(`Maximal ${MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erlaubt`)
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validate = (): boolean => {
    const validationErrors = validateProductForm(formData)
    setErrors(validationErrors)
    return isFormValid(validationErrors)
  }

  const reset = () => {
    setFormData(initialFormData)
    setErrors({})
  }

  return {
    formData,
    errors,
    updateField,
    addImages,
    removeImage,
    validate,
    reset,
  }
}



