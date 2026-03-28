import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils/slug'
import type { Category, BlogPostData, BlogPostFormProps } from './types'

export function useBlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<BlogPostData>({
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
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/blog/categories')
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch {
      // Ignore - categories are optional
    }
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !isEdit && (!prev.slug || prev.slug === generateSlug(prev.title))
        ? generateSlug(title)
        : prev.slug,
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
  }

  const handleSubmit = async (publish: boolean = false) => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const payload = { ...formData, isPublished: publish || formData.isPublished }
      const url = isEdit ? `/api/admin/blog/${initialData?.id}` : '/api/admin/blog'

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(publish ? 'Artikel veröffentlicht!' : 'Artikel gespeichert!')
        setTimeout(() => {
          router.push('/admin/content/blog')
          router.refresh()
        }, 1000)
      } else {
        setError(data.error || 'Speichern fehlgeschlagen')
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setSaving(false)
    }
  }

  return {
    formData,
    setFormData,
    categories,
    saving,
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
