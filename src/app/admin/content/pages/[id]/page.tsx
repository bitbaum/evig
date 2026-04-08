'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
} from 'lucide-react'
import { generateSlug } from '@/lib/utils/slug'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface PageData {
  id: string
  slug: string
  title: string
  content: string
  is_published: boolean
  seo_title: string | null
  seo_description: string | null
}

export default function EditStaticPagePage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const pageId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    is_published: false,
    seo_title: '',
    seo_description: '',
  })

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !pageId) return
    let cancelled = false
    async function loadPage() {
      setLoading(true)
      const result = await apiFetch<PageData>(`/api/admin/pages/${pageId}`)
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        const page = result.data
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          is_published: page.is_published || false,
          seo_title: page.seo_title || '',
          seo_description: page.seo_description || '',
        })
      } else {
        setError(result.error || 'Seite nicht gefunden')
      }
    }
    loadPage()
    return () => { cancelled = true }
  }, [sessionStatus, pageId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim() || !formData.slug.trim()) {
      setError('Titel und URL-Slug sind erforderlich')
      return
    }

    setSaving(true)
    const result = await apiFetch<void>(`/api/admin/pages/${pageId}`, {
      method: 'PUT',
      body: formData,
    })
    setSaving(false)

    if (result.success) {
      setSuccess('Seite erfolgreich gespeichert')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Fehler beim Speichern')
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  if (error && !formData.title) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/pages"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">Seite bearbeiten</Heading>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <Heading level={2} className="text-lg font-medium text-gray-900 dark:text-white mb-2">{error}</Heading>
          <Link
            href="/admin/content/pages"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zu Statische Seiten
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/pages"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
              Seite bearbeiten
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {formData.title || 'Unbenannt'}
            </p>
          </div>
        </div>
        {formData.slug && (
          <Link
            href={`/${formData.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </Link>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL-Slug *
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-gray-50 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-sm text-gray-500">
                /
              </div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Generieren
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inhalt
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="HTML oder Markdown Inhalt..."
            />
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Veröffentlicht
            </label>
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">SEO</Heading>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SEO Titel
            </label>
            <input
              type="text"
              value={formData.seo_title}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              placeholder={formData.title}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SEO Beschreibung
            </label>
            <textarea
              value={formData.seo_description}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
              placeholder="Kurze Beschreibung für Suchmaschinen..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/content/pages"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Speichern
          </button>
        </div>
      </form>
    </div>
  )
}
