'use client'

/**
 * Blog Post Form
 *
 * Reusable form for creating and editing blog posts.
 * Used by /admin/content/blog/new and /admin/content/blog/[id]
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Image as ImageIcon,
  Tag,
  Send,
  Sparkles,
  X,
  Wand2,
} from 'lucide-react'
import { BLOG_AI_QUICK_ACTIONS } from '@/config/blog'

interface Category {
  id: string
  name: string
  slug: string
}

interface BlogPostData {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  categoryId: string
  tags: string[]
  isPublished: boolean
  seoTitle: string
  seoDescription: string
}

interface BlogPostFormProps {
  initialData?: Partial<BlogPostData>
  isEdit?: boolean
}

export function BlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  // AI Generation/Refinement state
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
      if (data.success) {
        setCategories(data.data)
      }
    } catch {
      // Ignore - categories are optional
    }
  }

  const generateSlug = (title: string) => {
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

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug only if creating new post and slug is empty or matches old auto-generated
      slug: !isEdit && (!prev.slug || prev.slug === generateSlug(prev.title))
        ? generateSlug(title)
        : prev.slug,
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }))
  }

  const handleSubmit = async (publish: boolean = false) => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const payload = {
        ...formData,
        isPublished: publish || formData.isPublished,
      }

      const url = isEdit
        ? `/api/admin/blog/${initialData?.id}`
        : '/api/admin/blog'

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
    if (!aiTopic.trim()) {
      setAiError('Bitte geben Sie ein Thema ein')
      return
    }

    setAiError('')
    setAiGenerating(true)

    try {
      const selectedCategory = categories.find(c => c.id === formData.categoryId)

      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          category: selectedCategory?.name,
        }),
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
    if (!refineInstruction.trim()) {
      setAiError('Bitte geben Sie eine Anweisung ein')
      return
    }

    if (!formData.content || !formData.title) {
      setAiError('Bitte geben Sie zuerst Titel und Inhalt ein')
      return
    }

    setAiError('')
    setAiGenerating(true)

    try {
      const res = await fetch('/api/admin/blog/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: {
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            tags: formData.tags,
          },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/blog"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Änderungen am Artikel vornehmen' : 'Erstellen Sie einen neuen Blog-Artikel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit ? (
            <button
              onClick={() => openAIModal('refine')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Mit KI verbessern
            </button>
          ) : (
            <button
              onClick={() => openAIModal('generate')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Mit KI generieren
            </button>
          )}
          {formData.slug && isEdit && (
            formData.isPublished ? (
              <Link
                href={`/blog/${formData.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Veröffentlichten Artikel ansehen"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                title="Artikel muss zuerst veröffentlicht werden"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </span>
            )
          )}
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving || !formData.title || !formData.content}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving || !formData.title || !formData.content}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Veröffentlichen
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Titel des Artikels"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL-Slug
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm mr-2">/blog/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="url-slug"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kurzbeschreibung
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Kurze Beschreibung für Vorschau und SEO (max. 160 Zeichen)"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/160 Zeichen</p>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inhalt * (Markdown)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="# Überschrift&#10;&#10;Schreiben Sie hier Ihren Artikel in Markdown..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Status</h3>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
              </label>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formData.isPublished ? 'Veröffentlicht' : 'Entwurf'}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Kategorie</h3>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Keine Kategorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Featured Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Beitragsbild
            </h3>
            <input
              type="text"
              value={formData.featuredImage}
              onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://..."
            />
            {formData.featuredImage && (
              <img
                src={formData.featuredImage}
                alt="Preview"
                className="mt-4 rounded-lg w-full h-32 object-cover"
              />
            )}
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tag hinzufügen"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-green-900 dark:hover:text-green-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Meta-Titel
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={formData.title || 'SEO Titel'}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Meta-Beschreibung
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={formData.excerpt || 'SEO Beschreibung'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generation/Refinement Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {aiMode === 'generate' ? (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Artikel mit KI generieren
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-purple-500" />
                    Artikel mit KI verbessern
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {aiMode === 'generate'
                ? 'Beschreiben Sie das Thema oder die Idee für Ihren Blog-Artikel. Die KI wird einen vollständigen Entwurf generieren.'
                : 'Beschreiben Sie, wie der Artikel verbessert werden soll, oder nutzen Sie die Schnellaktionen.'}
            </p>

            {aiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                {aiError}
              </div>
            )}

            <div className="space-y-4">
              {aiMode === 'generate' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thema / Idee *
                  </label>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder='z.B. "Wie man einen alten Laptop wieder fit macht" oder "Die Vorteile von Refurbished-Geräten für die Umwelt"'
                    disabled={aiGenerating}
                  />
                </div>
              ) : (
                <>
                  {/* Quick Actions for Refinement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schnellaktionen
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BLOG_AI_QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          onClick={() => handleAIRefine(action.prompt)}
                          disabled={aiGenerating}
                          className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/40 disabled:opacity-50 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">oder</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Eigene Anweisung
                    </label>
                    <textarea
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder='z.B. "Füge einen Abschnitt über Reparatur-Tipps hinzu" oder "Mache den Text ansprechender"'
                      disabled={aiGenerating}
                    />
                  </div>
                </>
              )}

              {formData.categoryId && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Kategorie: <span className="font-medium">{categories.find(c => c.id === formData.categoryId)?.name}</span>
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={aiGenerating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                {aiMode === 'generate' ? (
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !aiTopic.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generiere...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generieren
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAIRefine()}
                    disabled={aiGenerating || !aiInstruction.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verbessere...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Verbessern
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
