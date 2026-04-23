'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProductFormData, ProductListingErrors } from '../types'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'

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
  const t = useTranslations('marketplace.sell')
  const tf = useTranslations('marketplace.sell.form.errors')
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<ProductListingErrors>({})

  const validateProductForm = (data: ProductFormData): ProductListingErrors => {
    const errs: ProductListingErrors = {}
    if (!data.title.trim()) errs.title = tf('titleRequired')
    if (!data.description.trim()) errs.description = tf('descriptionRequired')
    if (!data.price.trim()) errs.price = tf('priceRequired')
    if (!data.category) errs.category = tf('categoryRequired')
    if (!data.condition) errs.condition = tf('conditionRequired')
    if (!data.location.trim()) errs.location = tf('locationRequired')
    return errs
  }

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
      throw new Error(t('maxImagesError', { max: MARKETPLACE_LIMITS.MAX_IMAGES }))
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
