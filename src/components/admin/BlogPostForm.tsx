'use client'

/**
 * Blog Post Form
 *
 * Reusable form for creating and editing blog posts.
 * Used by /admin/content/blog/new and /admin/content/blog/[id]
 */

import { Link } from '@/i18n/navigation'
import Heading from '@/components/admin/AdminHeading'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useBlogPostForm,
  BlogPostEditor,
  BlogPostSidebar,
} from './blog'
import type { BlogPostFormProps } from './blog'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { generateSlug } from '@/lib/utils/slug'

export function BlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const {
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
  } = useBlogPostForm({ initialData, isEdit })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/blog"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl text-neutral-900 dark:text-white">
              {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {isEdit ? 'Änderungen am Artikel vornehmen' : 'Erstelle einen neuen Blog-Artikel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.slug && isEdit && (
            formData.isPublished ? (
              <Link
                href={`/blog/${formData.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                title="Veröffentlichten Artikel ansehen"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                title="Artikel muss zuerst veröffentlicht werden"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </span>
            )
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={saving || !formData.title || !formData.content}
            className="gap-2 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={saving || !formData.title || !formData.content}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Veröffentlichen
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BlogPostEditor
          formData={formData}
          onFormDataChange={setFormData}
          onTitleChange={handleTitleChange}
        />

        <BlogPostSidebar
          formData={formData}
          categories={categories}
          tagInput={tagInput}
          onFormDataChange={setFormData}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </div>

      {/* AI Assist */}
      <AIFormAssist
        formType="blog-admin"
        variant="section"
        defaultExpanded={true}
        currentData={{
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          tags: formData.tags,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
        }}
        onFieldsFilled={(data) => {
          setFormData(prev => {
            const updated = { ...prev }
            if (data.title) {
              updated.title = String(data.title)
              updated.slug = generateSlug(String(data.title))
            }
            if (data.excerpt) updated.excerpt = String(data.excerpt)
            if (data.content) updated.content = String(data.content)
            if (Array.isArray(data.tags) && data.tags.length > 0) updated.tags = data.tags.map(String)
            if (data.seoTitle) updated.seoTitle = String(data.seoTitle)
            if (data.seoDescription) updated.seoDescription = String(data.seoDescription)
            return updated
          })
        }}
        placeholder={isEdit
          ? 'z.B. "Füge einen Abschnitt über Reparatur-Tipps hinzu" oder "Mache den Text ansprechender"'
          : 'Beschreibe das Thema oder die Idee für deinen Blog-Artikel...'
        }
      />
    </div>
  )
}
