import { useState, useEffect, useCallback } from 'react'
import { useFormHandler } from '@/hooks/useFormHandler'
import { generateSlug } from '@/lib/utils/slug'
import { apiFetch } from '@/lib/api/client'
import type { Category, BlogPostData, BlogPostFormProps } from './types'

export function useBlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tagInput, setTagInput] = useState('')

  const form = useFormHandler<BlogPostData>({
    initialData: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      content: initialData?.content || '',
      featuredImage: initialData?.featuredImage || '',
      categoryId: initialData?.categoryId || '',
      tags: initialData?.tags || [],
      isPublished: initialData?.isPublished || false,
      seoTitle: initialData?.seoTitle || '',
      seoDescription: initialData?.seoDescription || '',
    },
    apiEndpoint: '/api/admin/blog',
    isEdit,
    editId: initialData?.id,
    editMethod: 'PATCH',
    redirectTo: '/admin/content/blog',
    createSuccessMessage: 'Artikel gespeichert!',
    editSuccessMessage: 'Artikel gespeichert!',
  })

  const { data, setData, updateField, isSubmitting, error, success, submitCustom, setSuccess } = form

  useEffect(() => {
    let cancelled = false
    apiFetch<Category[]>('/api/admin/blog/categories').then(result => {
      if (!cancelled && result.success && result.data) setCategories(result.data)
    })
    return () => { cancelled = true }
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setData(prev => ({
      ...prev,
      title,
      slug: !isEdit && (!prev.slug || prev.slug === generateSlug(prev.title))
        ? generateSlug(title)
        : prev.slug,
    }))
  }, [isEdit, setData])

  const addTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !data.tags.includes(tag)) {
      updateField('tags', [...data.tags, tag])
      setTagInput('')
    }
  }, [tagInput, data.tags, updateField])

  const removeTag = useCallback((tagToRemove: string) => {
    updateField('tags', data.tags.filter(t => t !== tagToRemove))
  }, [data.tags, updateField])

  // Custom submit that supports the publish parameter
  const handleSubmit = useCallback(async (publish: boolean = false) => {
    const payload = { ...data, isPublished: publish || data.isPublished }
    const succeeded = await submitCustom(payload)
    if (succeeded && publish) {
      setSuccess('Artikel veröffentlicht!')
    }
  }, [data, submitCustom, setSuccess])

  return {
    formData: data,
    setFormData: setData,
    categories,
    saving: isSubmitting,
    error,
    success,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTitleChange,
    handleSubmit,
  }
}
