export interface Category {
  id: string
  name: string
  slug: string
}

/** Per-locale overlay draft edited in the language tabs (non-German locales). */
export interface BlogTranslationDraft {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
}

export interface BlogPostData {
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
  /** Translations keyed by locale (e.g. 'en', 'fr'). German is the base above. */
  translations: Record<string, BlogTranslationDraft>
}

/** Shape of a translation row as returned by GET /api/admin/blog/[id]. */
export interface BlogTranslationRow {
  locale: string
  title: string
  excerpt: string | null
  content: string
  seoTitle: string | null
  seoDescription: string | null
}

export interface BlogPostFormProps {
  initialData?: Partial<BlogPostData>
  isEdit?: boolean
}

/** An editable title/excerpt/content document — either the base or a translation. */
export interface EditorDoc {
  title: string
  excerpt: string
  content: string
}
