import type { BlogAudience } from '@/config/blog'

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
  /** True = machine-generated, not yet human-reviewed (drives the tab badge). */
  isMachine: boolean
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
  /** public = listed + indexed · link = shareable link · unlisted = password. */
  visibility: 'public' | 'unlisted' | 'link'
  /** Access control: public = alle · team = Mitarbeitende · author = Autor + Super-Admins. */
  audience: BlogAudience
  seoTitle: string
  seoDescription: string
  /** Fill missing locales from the German base on publish (default true). */
  autoTranslate: boolean
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
  isMachine?: boolean
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
