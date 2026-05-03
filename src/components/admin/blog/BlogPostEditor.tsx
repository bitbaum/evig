import type { BlogPostData } from './types'

interface Props {
  formData: BlogPostData
  onFormDataChange: (data: BlogPostData) => void
  onTitleChange: (title: string) => void
}

export function BlogPostEditor({ formData, onFormDataChange, onTitleChange }: Props) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Title & Slug */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-lg font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Titel des Artikels"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              URL-Slug
            </label>
            <div className="flex items-center">
              <span className="text-neutral-500 dark:text-neutral-400 text-sm mr-2">/blog/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => onFormDataChange({ ...formData, slug: e.target.value })}
                className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="url-slug"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Kurzbeschreibung
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => onFormDataChange({ ...formData, excerpt: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Kurze Beschreibung für Vorschau und SEO (max. 160 Zeichen)"
          maxLength={160}
        />
        <p className="text-xs text-neutral-500 mt-1">{formData.excerpt.length}/160 Zeichen</p>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Inhalt * (Markdown)
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
          rows={20}
          className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="# Überschrift&#10;&#10;Schreibe hier deinen Artikel in Markdown..."
        />
      </div>
    </div>
  )
}
