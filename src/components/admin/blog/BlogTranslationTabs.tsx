import { Check, Sparkles, Languages, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { localeLabels, defaultLocale, type Locale } from '@/i18n/routing'

interface Props {
  activeLocale: string
  translatableLocales: readonly string[]
  onSelect: (locale: string) => void
  /** Whether a given translation locale already has a complete draft. */
  hasContent: (locale: string) => boolean
  /** Whether a locale's content is machine-made and not yet human-reviewed. */
  isMachine: (locale: string) => boolean
  /** Show the AI "translate all" button (only once the post exists). */
  canTranslate?: boolean
  translating?: boolean
  onTranslateAll?: () => void
  /** Auto-translate-on-publish toggle. */
  autoTranslate?: boolean
  onAutoTranslateChange?: (on: boolean) => void
}

/**
 * Language tab bar for the blog editor. The first tab is the German base; each
 * remaining tab edits that locale's translation. A green check marks a
 * human-reviewed translation; an amber sparkle marks a machine translation that
 * still wants review. The auto-translate toggle fills missing locales on publish.
 */
export function BlogTranslationTabs({
  activeLocale,
  translatableLocales,
  onSelect,
  hasContent,
  isMachine,
  canTranslate,
  translating,
  onTranslateAll,
  autoTranslate,
  onAutoTranslateChange,
}: Props) {
  const tab = (locale: string, label: string, isReviewIcon: boolean) => {
    const active = activeLocale === locale
    const done = isReviewIcon && hasContent(locale)
    const machine = done && isMachine(locale)
    return (
      <Button
        key={locale}
        size="sm"
        variant={active ? 'primary' : 'ghost'}
        onClick={() => onSelect(locale)}
        aria-current={active ? 'true' : undefined}
        className={active ? 'gap-1.5' : 'gap-1.5 bg-surface-raised text-text-secondary hover:bg-surface-overlay'}
        title={machine ? `${label} — automatisch übersetzt, bitte prüfen` : undefined}
      >
        {label}
        {done && machine && <Sparkles className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-warning-500'}`} />}
        {done && !machine && <Check className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-primary-600'}`} />}
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-subtle bg-surface-base p-3">
        <span className="px-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">Sprache</span>
        {tab(defaultLocale, `${localeLabels[defaultLocale as Locale]} (Basis)`, false)}
        {translatableLocales.map((loc) => tab(loc, localeLabels[loc as Locale] || loc, true))}
        {canTranslate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onTranslateAll}
            disabled={translating}
            className="ml-auto gap-1.5"
            title="Fehlende Sprachen automatisch aus der deutschen Basis übersetzen (KI). Danach pro Sprache prüfen."
          >
            {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            {translating ? 'Übersetze…' : 'Fehlende übersetzen'}
          </Button>
        )}
      </div>
      {onAutoTranslateChange && (
        <label className="flex items-center gap-2 px-1 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={autoTranslate ?? true}
            onChange={(e) => onAutoTranslateChange(e.target.checked)}
            className="h-4 w-4 rounded border-strong text-primary-600 focus:ring-primary-500"
          />
          Beim Veröffentlichen fehlende Sprachen automatisch übersetzen
          <Sparkles className="w-3.5 h-3.5 text-warning-500" />
        </label>
      )}
    </div>
  )
}
