/**
 * Presentation Decks — SINGLE SOURCE OF TRUTH
 *
 * Static HTML presentation decks live in `public/presentations/<slug>/index.html`.
 * next.config.js rewrites `/presentations/:slug` → `.../index.html` and sets
 * `X-Robots-Tag: noindex` — decks are shareable by link WITHOUT registration
 * (unlisted), but invisible to search engines.
 *
 * This registry is what the admin "Präsentationen" page renders. Adding a new
 * deck = drop the folder into public/presentations/ + add one entry here.
 */

export interface PresentationDeck {
  /** Folder name under public/presentations/ (= URL slug) */
  slug: string
  title: string
  description: string
  /** Who the deck was made for (audience badge in admin) */
  audience: string
  /** Creation month, ISO format YYYY-MM */
  createdMonth: string
}

export const PRESENTATION_DECKS: PresentationDeck[] = [
  {
    slug: 'aoz-wohnen',
    title: 'AOZ Wohnen: Digitale Wohnungsverwaltung',
    description: 'Digitale Wohnungsverwaltung für Geflüchtete — einfach, sicher, human',
    audience: 'AOZ',
    createdMonth: '2026-03',
  },
  {
    slug: 'ki-nachhaltigkeit',
    title: 'KI im Kontext der Nachhaltigkeit',
    description: 'Vortrag über KI und Nachhaltigkeit an den Informatiktagen Zürich',
    audience: 'Informatiktage Zürich',
    createdMonth: '2026-03',
  },
  {
    slug: 'kivvi',
    title: 'Kivvi: AI-First ERP',
    description: 'Das ERP-System für Schweizer KMU — intelligent, einfach, bezahlbar',
    audience: 'Schweizer KMU',
    createdMonth: '2026-03',
  },
  {
    slug: 'revamp-info',
    title: 'Revamp-Info: Dashboard',
    description: 'Fundraising-Pipeline, Investor-CRM, Export — alles in einem Tool',
    audience: 'Team intern',
    createdMonth: '2026-03',
  },
  {
    slug: 'revampit-neu',
    title: 'RevampIT: Die neue Plattform',
    description: 'Was hat die neue Seite, was die alte nicht hat?',
    audience: 'AOZ',
    createdMonth: '2026-03',
  },
  {
    slug: 'swico-monitor-upcycling',
    title: 'Monitor-Upcycling — Abschlusspräsentation Swico',
    description: 'Projektresultate Funktionelle Kreislaufnutzung von IT-Geräten',
    audience: 'Swico',
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch',
    title: 'Bewerbung Kraftwerk1: Siedlung Koch',
    description: 'Bewerbung für zwei Ladenlokale im Erdgeschoss der Siedlung Koch — für die Vergabekommission Kraftwerk1',
    audience: 'Kraftwerk1',
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch-vorschlag',
    title: 'Siedlung Koch — Gestaltungsvorschlag',
    description: 'Die Inhalte des Team-Decks, neu gestaltet — gleiche Aussage, bessere Umsetzung',
    audience: 'Kraftwerk1',
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch-original',
    title: 'Siedlung Koch — Original (Team)',
    description: 'Die Präsentation des Teams, inhaltlich unverändert übernommen',
    audience: 'Kraftwerk1',
    createdMonth: '2026-07',
  },
  // NB: the Kivitendo intake mockup is served at /presentations/kivitendo-intake
  // (the rewrite works without a registry entry) but is catalogued as a
  // Deliverable (see /admin/deliverables), not a presentation deck.
]

/**
 * URL of a deck. Without `base` returns the site-relative path
 * (`/presentations/<slug>`); with `base` (e.g. window.location.origin)
 * returns the absolute, shareable URL.
 */
export function presentationUrl(slug: string, base?: string): string {
  const path = `/presentations/${slug}`
  return base ? `${base}${path}` : path
}
