'use client'

import { useParams } from 'next/navigation'
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
import Heading from '@/components/admin/AdminHeading'
import { useEditStaticPage } from '@/hooks/useEditStaticPage'

export default function EditStaticPagePage() {
  const params = useParams()
  const pageId = params.id as string

  const {
    session,
    sessionStatus,
    router,
    loading,
    saving,
    error,
    success,
    formData,
    setFormData,
    handleSubmit,
  } = useEditStaticPage(pageId)

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 bg-neutral-200 rounded animate-pulse"></div>
          <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-8">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-200 rounded"></div>
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
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">Seite bearbeiten</Heading>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
          <Heading level={2} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">{error}</Heading>
          <Link
            href="/admin/content/pages"
            className="inline-flex items-center text-info-600 hover:text-info-700 mt-4"
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
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
              Seite bearbeiten
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {formData.title || 'Unbenannt'}
            </p>
          </div>
        </div>
        {formData.slug && (
          <Link
            href={`/${formData.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </Link>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0" />
          <p className="text-error-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <p className="text-primary-800">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-neutral-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              URL-Slug *
            </label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-neutral-50 dark:bg-neutral-700 border border-r-0 border-neutral-300 dark:border-neutral-600 rounded-l-lg text-sm text-neutral-500">
                /
              </div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-r-lg focus:ring-2 focus:ring-teal-500 dark:bg-neutral-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
              >
                Generieren
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Inhalt
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-neutral-700 dark:text-white font-mono text-sm"
              placeholder="HTML oder Markdown Inhalt..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-teal-600 border-neutral-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Veröffentlicht
            </label>
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6 space-y-6">
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">SEO</Heading>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              SEO Titel
            </label>
            <input
              type="text"
              value={formData.seo_title}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              placeholder={formData.title}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-neutral-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              SEO Beschreibung
            </label>
            <textarea
              value={formData.seo_description}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-neutral-700 dark:text-white"
              placeholder="Kurze Beschreibung für Suchmaschinen..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/content/pages"
            className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
