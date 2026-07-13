import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { EditorDoc } from './types'

interface Props {
  /** True when editing the German base; false when editing a translation. */
  isBase: boolean
  /** Active locale being edited (for translation hints). */
  locale: string
  /** The document currently under edit — base fields or a translation draft. */
  doc: EditorDoc
  /** Locale-independent slug (only editable on the base). */
  slug: string
  onDocChange: (patch: Partial<EditorDoc>) => void
  onTitleChange: (title: string) => void
  onSlugChange: (slug: string) => void
}

export function BlogPostEditor({ isBase, locale, doc, slug, onDocChange, onTitleChange, onSlugChange }: Props) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {!isBase && (
        <div className="rounded-lg border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20 px-4 py-3 text-sm text-info-700 dark:text-info-300">
          Übersetzung für <strong>{locale.toUpperCase()}</strong>. Leere Felder fallen im Frontend
          auf die deutsche Basis zurück. Titel und Inhalt sind für eine Übersetzung erforderlich.
        </div>
      )}

      {/* Title & Slug */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Titel *
            </label>
            <Input
              type="text"
              value={doc.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-lg font-medium"
              placeholder="Titel des Artikels"
            />
          </div>

          {/* Slug is locale-independent — only edited on the base document. */}
          {isBase && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                URL-Slug
              </label>
              <div className="flex items-center">
                <span className="text-text-tertiary text-sm mr-2">/blog/</span>
                <Input
                  type="text"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  className="flex-1"
                  placeholder="url-slug"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Excerpt */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Kurzbeschreibung
        </label>
        <Textarea
          value={doc.excerpt}
          onChange={(e) => onDocChange({ excerpt: e.target.value })}
          rows={3}
          placeholder="Kurze Beschreibung für Vorschau und SEO (max. 160 Zeichen)"
          maxLength={160}
        />
        <p className="text-xs text-text-tertiary mt-1">{doc.excerpt.length}/160 Zeichen</p>
      </div>

      {/* Content */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Inhalt * (Markdown)
        </label>
        <Textarea
          value={doc.content}
          onChange={(e) => onDocChange({ content: e.target.value })}
          rows={20}
          className="font-mono text-sm"
          placeholder="# Überschrift&#10;&#10;Schreibe hier deinen Artikel in Markdown..."
        />
      </div>
    </div>
  )
}
