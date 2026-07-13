'use client'

/**
 * Blog Post Form
 *
 * Reusable form for creating and editing blog posts.
 * Used by /admin/content/blog/new and /admin/content/blog/[id]
 */

import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
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
  BlogTranslationTabs,
} from './blog'
import type { BlogPostFormProps } from './blog'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { generateSlug } from '@/lib/utils/slug'
import { ROUTES } from '@/config/routes'

export function BlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const t = useTranslations('admin.blog.form')
  const tForms = useTranslations('admin.forms')
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
    handleSubmit,
    activeLocale,
    setActiveLocale,
    isBase,
    activeDoc,
    updateActiveDoc,
    handleActiveTitleChange,
    localeHasContent,
    localeIsMachine,
    translatableLocales,
    canTranslate,
    translating,
    translateAll,
    autoTranslate,
    setAutoTranslate,
  } = useBlogPostForm({ initialData, isEdit })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.admin.contentBlog}
            className={`p-2 ${adminInteractive.rowHover} rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl text-text-primary">
              {isEdit ? t('editPost') : t('newPost')}
            </Heading>
            <p className="text-text-secondary mt-1">
              {isEdit ? t('editSubtitle') : t('newSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.slug && isEdit && (
            // Staff can preview drafts too (the public page renders unpublished
            // posts for logged-in staff), so the link is always available.
            <Link
              href={ROUTES.public.blogPost(formData.slug)}
              target="_blank"
              className={`inline-flex items-center gap-2 px-4 py-2 text-text-secondary ${adminInteractive.rowHover} rounded-lg transition-colors`}
              title={t('previewTitle')}
            >
              <Eye className="w-4 h-4" />
              {t('preview')}{!formData.isPublished && ' (Entwurf)'}
            </Link>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={saving || !formData.title || !formData.content}
            className="gap-2 bg-surface-overlay hover:bg-surface-overlay disabled:bg-surface-overlay"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tForms('save')}
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={saving || !formData.title || !formData.content}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('publish')}
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
        <div className="bg-action-muted border border-strong text-action px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <BlogTranslationTabs
        activeLocale={activeLocale}
        translatableLocales={translatableLocales}
        onSelect={setActiveLocale}
        hasContent={localeHasContent}
        isMachine={localeIsMachine}
        canTranslate={canTranslate}
        translating={translating}
        onTranslateAll={translateAll}
        autoTranslate={autoTranslate}
        onAutoTranslateChange={setAutoTranslate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BlogPostEditor
          isBase={isBase}
          locale={activeLocale}
          doc={activeDoc}
          slug={formData.slug}
          onDocChange={updateActiveDoc}
          onTitleChange={handleActiveTitleChange}
          onSlugChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
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
        placeholder={isEdit ? t('aiPlaceholderEdit') : t('aiPlaceholderNew')}
      />
    </div>
  )
}
