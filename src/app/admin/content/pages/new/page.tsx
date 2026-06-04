'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { generateSlug } from '@/lib/utils/slug'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

function NewStaticPageContent() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: searchParams.get('title') || '',
    slug: searchParams.get('slug') || '',
    content: '',
    is_published: false,
    seo_title: '',
    seo_description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.title.trim() || !formData.slug.trim()) {
      setError('Titel und URL-Slug sind erforderlich')
      return
    }

    setSaving(true)
    const result = await apiFetch<void>('/api/admin/pages', {
      method: 'POST',
      body: formData,
    })
    setSaving(false)

    if (result.success) {
      router.push('/admin/content/pages')
    } else {
      setError(result.error || 'Fehler beim Erstellen der Seite')
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-neutral-200 rounded-sm w-1/3 animate-pulse"></div>
        <div className="bg-surface-base rounded-xl shadow-xs border p-8">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-200 rounded-sm"></div>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.admin.contentPages}
          className="p-2 hover:bg-surface-raised dark:hover:bg-surface-base/6 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <Heading level={1} className="text-2xl font-bold text-text-primary">
            Neue Seite erstellen
          </Heading>
          <p className="text-text-secondary mt-1">
            Erstelle eine neue statische Seite
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 shrink-0" />
          <p className="text-error-800 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6 space-y-6">
          {/* Title */}
          <FormField label="Titel" required htmlFor="page-title">
            <Input
              id="page-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value
                setFormData(prev => ({
                  ...prev,
                  title,
                  slug: prev.slug || generateSlug(title),
                }))
              }}
              placeholder="z.B. Über uns"
              required
              autoFocus
            />
          </FormField>

          {/* Slug */}
          <FormField label="URL-Slug" required>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-surface-raised border border-r-0 border-neutral-300 rounded-l-lg text-sm text-text-tertiary">
                /
              </div>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 rounded-l-none"
                placeholder="ueber-uns"
                required
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/6 text-text-secondary"
              >
                Generieren
              </button>
            </div>
          </FormField>

          {/* Content */}
          <FormField label="Inhalt">
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="font-mono text-sm"
              placeholder="HTML oder Markdown Inhalt..."
            />
          </FormField>

          {/* Published */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="w-4 h-4 text-action border-neutral-300 rounded-sm focus:ring-action"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-text-secondary">
              Sofort veröffentlichen
            </label>
          </div>
        </div>

        {/* SEO Section */}
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6 space-y-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary">SEO</Heading>

          <FormField label="SEO Titel" htmlFor="seo-title">
            <Input
              id="seo-title"
              type="text"
              value={formData.seo_title}
              onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              placeholder={formData.title || 'Wird vom Titel übernommen'}
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

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href={ROUTES.admin.contentPages}
            className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-raised transition-colors"
          >
            Abbrechen
          </Link>
          <Button type="submit" disabled={saving} variant="primary" className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Seite erstellen
          </Button>
        </div>
      </form>
    </div>
  )
}

function NewStaticPageFallback() {
  return (
    <div className="space-y-8">
      <div className="h-8 bg-neutral-200 rounded-sm w-1/3 animate-pulse"></div>
      <div className="bg-surface-base rounded-xl shadow-xs border p-8">
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-neutral-200 rounded-sm"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NewStaticPagePage() {
  return (
    <Suspense fallback={<NewStaticPageFallback />}>
      <NewStaticPageContent />
    </Suspense>
  )
}
