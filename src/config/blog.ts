/**
 * Blog Configuration
 *
 * SSOT for blog AI quick actions and related config.
 * Used by: BlogPostForm
 */

export const BLOG_AI_QUICK_ACTIONS = [
  {
    key: 'shorter',
    label: 'Kürzer',
    prompt: 'Kürze den Artikel auf etwa die Hälfte der Länge. Behalte die wichtigsten Punkte bei.',
  },
  {
    key: 'longer',
    label: 'Ausführlicher',
    prompt: 'Erweitere den Artikel mit mehr Details, Beispielen und praktischen Tipps. Verdopple etwa die Länge.',
  },
  {
    key: 'seoOptimize',
    label: 'SEO-optimiert',
    prompt: 'Optimiere den Artikel für Suchmaschinen: Verbessere Titel, füge relevante Keywords ein, strukturiere mit besseren Überschriften.',
  },
] as const
