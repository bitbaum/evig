import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFormHandler } from '@/hooks/useFormHandler'
import { generateSlug } from '@/lib/utils/slug'
import { apiFetch } from '@/lib/api/client'
import { locales, defaultLocale } from '@/i18n/routing'
import type { Category, BlogPostData, BlogPostFormProps, BlogTranslationDraft, EditorDoc } from './types'

const EMPTY_DRAFT: BlogTranslationDraft = {
  title: '',
  excerpt: '',
  content: '',
  seoTitle: '',
  seoDescription: '',
  isMachine: false,
}

/** Locales an admin can translate INTO — everything except the German base. */
export const TRANSLATABLE_LOCALES = locales.filter((l) => l !== defaultLocale)

export function useBlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tagInput, setTagInput] = useState('')
  const [translating, setTranslating] = useState(false)
  // 'de' = the base document; any other value edits that locale's translation.
  const [activeLocale, setActiveLocale] = useState<string>(defaultLocale)

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
      visibility: initialData?.visibility || 'public',
      seoTitle: initialData?.seoTitle || '',
      seoDescription: initialData?.seoDescription || '',
      autoTranslate: initialData?.autoTranslate ?? true,
      translations: initialData?.translations || {},
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

  // ── Locale-aware editing ────────────────────────────────────────────────
  const isBase = activeLocale === defaultLocale

  const activeDoc: EditorDoc = useMemo(() => {
    if (isBase) return { title: data.title, excerpt: data.excerpt, content: data.content }
    const t = data.translations[activeLocale]
    return { title: t?.title || '', excerpt: t?.excerpt || '', content: t?.content || '' }
  }, [isBase, activeLocale, data.title, data.excerpt, data.content, data.translations])

  const updateActiveDoc = useCallback((patch: Partial<EditorDoc>) => {
    if (isBase) {
      setData(prev => ({ ...prev, ...patch }))
      return
    }
    setData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        // A human edited this locale → it's no longer machine-only.
        [activeLocale]: { ...EMPTY_DRAFT, ...prev.translations[activeLocale], ...patch, isMachine: false },
      },
    }))
  }, [isBase, activeLocale, setData])

  // Base title also drives the slug; translation titles are just text.
  const handleActiveTitleChange = useCallback((title: string) => {
    if (isBase) handleTitleChange(title)
    else updateActiveDoc({ title })
  }, [isBase, handleTitleChange, updateActiveDoc])

  /** A locale "has content" once its title and body are both filled. */
  const localeHasContent = useCallback((loc: string) => {
    const t = data.translations[loc]
    return !!(t?.title?.trim() && t?.content?.trim())
  }, [data.translations])

  /** True when a locale's content is machine-made and not yet human-reviewed. */
  const localeIsMachine = useCallback((loc: string) => data.translations[loc]?.isMachine === true, [data.translations])

  const setAutoTranslate = useCallback((on: boolean) => updateField('autoTranslate', on), [updateField])

  // Custom submit: fold the translations map into the array the API expects,
  // dropping any locale that isn't a complete (title + body) draft.
  const handleSubmit = useCallback(async (publish: boolean = false) => {
    const translations = Object.entries(data.translations)
      .filter(([, t]) => t.title.trim() && t.content.trim())
      .map(([locale, t]) => ({
        locale,
        title: t.title,
        excerpt: t.excerpt || null,
        content: t.content,
        seoTitle: t.seoTitle || null,
        seoDescription: t.seoDescription || null,
        isMachine: t.isMachine,
      }))
    const payload = { ...data, isPublished: publish || data.isPublished, translations }
    const succeeded = await submitCustom(payload)
    if (succeeded && publish) {
      setSuccess('Artikel veröffentlicht!')
    }
  }, [data, submitCustom, setSuccess])

  // AI-translate the German base into every missing locale, then pull the fresh
  // rows back into the tabs. Only available once the post exists (needs an id).
  const canTranslate = isEdit && !!initialData?.id
  const translateAll = useCallback(async () => {
    const id = initialData?.id
    if (!id) return
    setTranslating(true)
    try {
      const res = await apiFetch<{ message?: string }>(`/api/admin/blog/${id}/translate`, {
        method: 'POST',
        body: {},
      })
      if (res.success) {
        const fresh = await apiFetch<{ translations?: Array<{
          locale: string; title: string; excerpt: string | null; content: string
          seoTitle: string | null; seoDescription: string | null; isMachine?: boolean
        }> }>(`/api/admin/blog/${id}`)
        if (fresh.success && fresh.data?.translations) {
          const map: Record<string, BlogTranslationDraft> = {}
          for (const t of fresh.data.translations) {
            map[t.locale] = {
              title: t.title,
              excerpt: t.excerpt || '',
              content: t.content,
              seoTitle: t.seoTitle || '',
              seoDescription: t.seoDescription || '',
              isMachine: t.isMachine ?? true,
            }
          }
          setData(prev => ({ ...prev, translations: map }))
        }
        setSuccess(res.data?.message || 'Übersetzt!')
      }
    } finally {
      setTranslating(false)
    }
  }, [initialData?.id, setData, setSuccess])

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
    // Locale-aware editing surface
    activeLocale,
    setActiveLocale,
    isBase,
    activeDoc,
    updateActiveDoc,
    handleActiveTitleChange,
    localeHasContent,
    localeIsMachine,
    translatableLocales: TRANSLATABLE_LOCALES,
    // AI translation
    canTranslate,
    translating,
    translateAll,
    autoTranslate: data.autoTranslate,
    setAutoTranslate,
  }
}
