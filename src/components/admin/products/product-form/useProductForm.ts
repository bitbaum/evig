'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import type { ProductFormData } from './types'
import { INITIAL_PRODUCT_FORM_DATA } from './types'

export function useProductForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_PRODUCT_FORM_DATA)

  const handleInputChange = (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => {
    if (field === 'title' && typeof value === 'string' && !formData.handle) {
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
      variants: [...prev.variants, { title: '', sku: '', price: '', inventory: '0' }],
    }))
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))

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
      images: prev.images.filter((_, i) => i !== index),
    }))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const setFormDataDirect = setFormData

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const productData = {
        title: formData.title,
        handle: formData.handle,
        description: formData.description,
        status: 'published',
        is_giftcard: false,
        discountable: true,
        tags: formData.tags.map(tag => ({ value: tag })),
        variants: formData.variants.map(variant => ({
          title: variant.title || 'Default Variant',
          sku: variant.sku || `${formData.handle}-${variant.title}`,
          inventory_quantity: parseInt(variant.inventory) || 0,
          prices: [{
            amount: Math.round(parseFloat(variant.price) * 100),
            currency_code: 'chf',
          }],
        })),
      }

      const result = await apiFetch<{ id: string }>('/api/admin/products', {
        method: 'POST',
        body: productData,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      logger.info('Product created successfully', { productId: result.data?.id })
      router.push('/admin/products')
    } catch (error) {
      logger.error('Error saving product', { error })
      alert(`Error creating product: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    isLoading,
    imagePreviews,
    handleInputChange,
    handleVariantChange,
    addVariant,
    removeVariant,
    handleImageUpload,
    removeImage,
    setFormData: setFormDataDirect,
    handleSubmit,
  }
}
