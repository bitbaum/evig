import { Check, Languages, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { localeLabels, defaultLocale, type Locale } from '@/i18n/routing'

interface Props {
  activeLocale: string
  translatableLocales: readonly string[]
  onSelect: (locale: string) => void
  /** Whether a given translation locale already has a complete draft. */
  hasContent: (locale: string) => boolean
  /** Show the AI "translate all" button (only once the post exists). */
  canTranslate?: boolean
  translating?: boolean
  onTranslateAll?: () => void
}

/**
 * Language tab bar for the blog editor. The first tab is the German base; each
 * remaining tab edits that locale's translation. A check marks locales that
 * already have content so an admin sees translation coverage at a glance —
 * all in the UI, no git.
 */
export function BlogTranslationTabs({
  activeLocale,
  translatableLocales,
  onSelect,
  hasContent,
  canTranslate,
  translating,
  onTranslateAll,
}: Props) {
  const tab = (locale: string, label: string, done: boolean) => {
    const active = activeLocale === locale
    return (
      <Button
        key={locale}
        size="sm"
        variant={active ? 'primary' : 'ghost'}
        onClick={() => onSelect(locale)}
        aria-current={active ? 'true' : undefined}
        className={active ? 'gap-1.5' : 'gap-1.5 bg-surface-raised text-text-secondary hover:bg-surface-overlay'}
      >
        {label}
        {done && <Check className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-primary-600'}`} />}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-subtle bg-surface-base p-3">
      <span className="px-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">Sprache</span>
      {tab(defaultLocale, `${localeLabels[defaultLocale as Locale]} (Basis)`, false)}
      {translatableLocales.map((loc) =>
        tab(loc, localeLabels[loc as Locale] || loc, hasContent(loc)),
      )}
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
  )
}
