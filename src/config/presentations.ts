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
 *
 * ACCESS: the `audience` field gates who may OPEN the deck link:
 *   public — anyone with the link (no account) · team — logged-in staff only
 *   author — super-admins only.
 * Gating is enforced by the route handler `src/app/presentations/[slug]/route.ts`.
 * (Public decks stay pure static; restricted decks are served through the
 * session-checked handler.)
 */

import { CONTENT_AUDIENCE, type ContentAudience } from '@/config/content-audience'

export interface PresentationDeck {
  /** Folder name under public/presentations/ (= URL slug) */
  slug: string
  title: string
  description: string
  /** Who the deck was made FOR — a descriptive recipient label (badge + filter). */
  targetGroup: string
  /** WHO may open the deck (access control). Defaults to public. */
  audience: ContentAudience
  /** Creation month, ISO format YYYY-MM */
  createdMonth: string
}

export const PRESENTATION_DECKS: PresentationDeck[] = [
  {
    slug: 'revampit-portal',
    title: 'Revamp-IT — Die Plattform',
    description: 'Wie aus drei getrennten Alt-Systemen eine zusammenhängende Plattform wurde — Marktplatz, Werkstatt und Betrieb an einem Ort',
    targetGroup: 'Öffentlich',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'kivvi-plattform',
    title: 'Kivvi — Das ERP der Kreislaufwirtschaft',
    description: 'Das offene ERP für Betriebe, die Waren ein zweites Leben geben — Spenden, Einzelstücke, Reparatur, Schweizer Buchhaltung',
    targetGroup: 'Öffentlich',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'revamp-info-plattform',
    title: 'Revamp-Info — Fundraising & Transparenz',
    description: 'Transparenz nach aussen, Fundraising-Intelligenz nach innen — findet Stiftungen und erstellt Gesuche',
    targetGroup: 'Öffentlich',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'aoz-wohnen',
    title: 'AOZ Wohnen: Digitale Wohnungsverwaltung',
    description: 'Digitale Wohnungsverwaltung für Geflüchtete — einfach, sicher, human',
    targetGroup: 'AOZ',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-03',
  },
  {
    slug: 'ki-nachhaltigkeit',
    title: 'KI im Kontext der Nachhaltigkeit',
    description: 'Vortrag über KI und Nachhaltigkeit an den Informatiktagen Zürich',
    targetGroup: 'Informatiktage Zürich',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-03',
  },
  {
    slug: 'kivvi',
    title: 'Kivvi: AI-First ERP',
    description: 'Das ERP-System für Schweizer KMU — intelligent, einfach, bezahlbar',
    targetGroup: 'Schweizer KMU',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-03',
  },
  {
    slug: 'revamp-info',
    title: 'Revamp-Info: Dashboard',
    description: 'Fundraising-Pipeline, Investor-CRM, Export — alles in einem Tool',
    targetGroup: 'Team intern',
    audience: CONTENT_AUDIENCE.TEAM,
    createdMonth: '2026-03',
  },
  {
    slug: 'revampit-neu',
    title: 'RevampIT: Die neue Plattform',
    description: 'Was hat die neue Seite, was die alte nicht hat?',
    targetGroup: 'AOZ',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-03',
  },
  {
    slug: 'swico-monitor-upcycling',
    title: 'Monitor-Upcycling — Abschlusspräsentation Swico',
    description: 'Projektresultate Funktionelle Kreislaufnutzung von IT-Geräten',
    targetGroup: 'Swico',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch',
    title: 'Bewerbung Kraftwerk1: Siedlung Koch',
    description: 'Bewerbung für zwei Ladenlokale im Erdgeschoss der Siedlung Koch — für die Vergabekommission Kraftwerk1',
    targetGroup: 'Kraftwerk1',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch-vorschlag',
    title: 'Siedlung Koch — Gestaltungsvorschlag',
    description: 'Die Inhalte des Team-Decks, neu gestaltet — gleiche Aussage, bessere Umsetzung',
    targetGroup: 'Kraftwerk1',
    audience: CONTENT_AUDIENCE.PUBLIC,
    createdMonth: '2026-07',
  },
  {
    slug: 'bewerbung-koch-original',
    title: 'Siedlung Koch — Original (Team)',
    description: 'Die Präsentation des Teams, inhaltlich unverändert übernommen',
    targetGroup: 'Kraftwerk1',
    audience: CONTENT_AUDIENCE.PUBLIC,
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
