'use client'

import { useParams } from 'next/navigation'
import { adminInteractive } from '@/lib/admin-ui'
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
import { ROUTES } from '@/config/routes'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
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
          <div className="h-5 w-5 bg-surface-overlay rounded-sm animate-pulse"></div>
          <div className="h-8 bg-surface-overlay rounded-sm w-1/3 animate-pulse"></div>
        </div>
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-8">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-overlay rounded-sm"></div>
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
            href={ROUTES.admin.contentPages}
            className={`p-2 ${adminInteractive.rowHover} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Heading level={1} className="text-2xl font-bold text-text-primary">Seite bearbeiten</Heading>
        </div>
        <div className="bg-surface-base rounded-xl shadow-xs border p-8 text-center">
          <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
          <Heading level={2} className="text-lg font-medium text-text-primary mb-2">{error}</Heading>
          <Link
            href={ROUTES.admin.contentPages}
            className="inline-flex items-center text-action hover:text-action mt-4"
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
            href={ROUTES.admin.contentPages}
            className={`p-2 ${adminInteractive.rowHover} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">
              Seite bearbeiten
            </Heading>
            <p className="text-text-secondary mt-1">
              {formData.title || 'Unbenannt'}
            </p>
          </div>
        </div>
        {formData.slug && (
          <Link
            href={`/${formData.slug}`}
            target="_blank"
            className={`inline-flex items-center gap-2 px-4 py-2 border border-default rounded-lg text-sm text-text-secondary ${adminInteractive.rowHover} transition-colors`}
          >
            <Eye className="w-4 h-4" />
            Vorschau
          </Link>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 shrink-0" />
          <p className="text-error-800 dark:text-error-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-action-muted border border-strong rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-action shrink-0" />
          <p className="text-action">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-6 space-y-6">
          <FormField label="Titel" required htmlFor="page-title">
            <Input
              id="page-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="URL-Slug" required>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-surface-raised border border-r-0 border-default rounded-l-lg text-sm text-text-tertiary">
                /
              </div>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 rounded-l-none"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                className={`px-3 py-2 text-sm border border-default rounded-lg ${adminInteractive.rowHover} text-text-secondary`}
              >
                Generieren
              </Button>
            </div>
          </FormField>

          <FormField label="Inhalt">
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="font-mono text-sm"
              placeholder="HTML oder Markdown Inhalt..."
            />
          </FormField>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-action border-default rounded-sm focus:ring-action"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-text-secondary">
              Veröffentlicht
            </label>
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-6 space-y-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary">SEO</Heading>

          <FormField label="SEO Titel" htmlFor="seo-title">
            <Input
              id="seo-title"
              type="text"
              value={formData.seo_title}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              placeholder={formData.title}
            />
          </FormField>

          <FormField label="SEO Beschreibung">
            <Textarea
              value={formData.seo_description}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
              rows={3}
              placeholder="Kurze Beschreibung für Suchmaschinen..."
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={ROUTES.admin.contentPages}
            className={`px-4 py-2 border border-default rounded-lg text-sm font-medium text-text-secondary ${adminInteractive.rowHover} transition-colors`}
          >
            Abbrechen
          </Link>
          <Button type="submit" disabled={saving} variant="primary" className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </Button>
        </div>
      </form>
    </div>
  )
}
