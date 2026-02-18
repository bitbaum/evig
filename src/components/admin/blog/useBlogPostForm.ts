import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BLOG_AI_QUICK_ACTIONS } from '@/config/blog'
import type { Category, BlogPostData, BlogPostFormProps } from './types'

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[äöüÄÖÜ]/g, (match) => {
      const map: Record<string, string> = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
        'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue'
      }
      return map[match] || match
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

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

  // AI state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiMode, setAiMode] = useState<'generate' | 'refine'>('generate')
  const [aiTopic, setAiTopic] = useState('')
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')

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

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) { setAiError('Bitte geben Sie ein Thema ein'); return }
    setAiError('')
    setAiGenerating(true)

    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId)
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, category: selectedCategory?.name }),
      })

      const data = await res.json()
      if (data.success && data.data?.generated) {
        const gen = data.data.generated
        setFormData(prev => ({
          ...prev,
          title: gen.title || prev.title,
          slug: generateSlug(gen.title || prev.title),
          excerpt: gen.excerpt || prev.excerpt,
          content: gen.content || prev.content,
          tags: gen.tags?.length > 0 ? gen.tags : prev.tags,
          seoTitle: gen.seoTitle || prev.seoTitle,
          seoDescription: gen.seoDescription || prev.seoDescription,
        }))
        setShowAIModal(false)
        setAiTopic('')
        setSuccess('Artikel mit KI generiert! Bitte überprüfen und anpassen.')
      } else {
        setAiError(data.error || 'Generierung fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAIRefine = async (instruction?: string) => {
    const refineInstruction = instruction || aiInstruction
    if (!refineInstruction.trim()) { setAiError('Bitte geben Sie eine Anweisung ein'); return }
    if (!formData.content || !formData.title) { setAiError('Bitte geben Sie zuerst Titel und Inhalt ein'); return }

    setAiError('')
    setAiGenerating(true)

    try {
      const res = await fetch('/api/admin/blog/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: { title: formData.title, excerpt: formData.excerpt, content: formData.content, tags: formData.tags },
          instruction: refineInstruction,
        }),
      })

      const data = await res.json()
      if (data.success && data.data?.refined) {
        const ref = data.data.refined
        setFormData(prev => ({
          ...prev,
          title: ref.title || prev.title,
          excerpt: ref.excerpt || prev.excerpt,
          content: ref.content || prev.content,
          tags: ref.tags?.length > 0 ? ref.tags : prev.tags,
          seoTitle: ref.seoTitle || prev.seoTitle,
          seoDescription: ref.seoDescription || prev.seoDescription,
        }))
        setShowAIModal(false)
        setAiInstruction('')
        setSuccess('Artikel mit KI verbessert! Bitte überprüfen.')
      } else {
        setAiError(data.error || 'Verbesserung fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setAiGenerating(false)
    }
  }

  const openAIModal = (mode: 'generate' | 'refine') => {
    setAiMode(mode)
    setAiError('')
    setAiTopic('')
    setAiInstruction('')
    setShowAIModal(true)
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
    // AI
    showAIModal,
    setShowAIModal,
    aiMode,
    aiTopic,
    setAiTopic,
    aiInstruction,
    setAiInstruction,
    aiGenerating,
    aiError,
    handleAIGenerate,
    handleAIRefine,
    openAIModal,
    quickActions: BLOG_AI_QUICK_ACTIONS,
  }
}
