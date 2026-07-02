/**
 * Hirn Page Contexts — SSOT for the assistant's page awareness
 *
 * One entry per page area, for both surfaces (public site and admin).
 * The `description` is fed to the LLM as system-prompt context ("the user
 * is currently looking at X"); `suggestions` are the question chips shown
 * in the empty chat; `quickActions` are relevant deep links.
 *
 * Admin labels/descriptions derive from src/config/sections.ts (SSOT) —
 * never duplicate a section label here. Public routes come from
 * src/config/routes.ts.
 *
 * NOTE: suggestions/descriptions are German only by design — DE is the
 * canonical locale and the assistant mirrors the user's language anyway.
 */

import { getSection } from '@/config/sections'
import { ROUTES } from '@/config/routes'
import { locales } from '@/i18n/routing'

export interface HirnPageContext {
  /** Matched against the locale-stripped pathname; first match wins. */
  pattern: RegExp
  /** Stable identifier for logging/analytics. */
  area: string
  /** 1-2 German sentences telling the LLM what the user is looking at. */
  description: string
  /** 2-3 short German question chips shown when the chat is empty. */
  suggestions: string[]
  /** Relevant deep links rendered as buttons. */
  quickActions?: { label: string; href: string }[]
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

const P = ROUTES.public

// Dashboard paths live in the sections SSOT (no ROUTES.dashboard entries).
const dashPath = (sectionId: string, fallback: string): string =>
  getSection(sectionId)?.path ?? fallback
const DASH = {
  listings: dashPath('my-listings', '/dashboard/listings'),
  orders: dashPath('my-orders', '/dashboard/orders'),
}

export const PUBLIC_PAGE_CONTEXTS: HirnPageContext[] = [
  {
    pattern: /^\/marketplace\/sell/,
    area: 'marketplace-sell',
    description:
      'Die Nutzerin ist auf dem Verkaufsformular des Marktplatzes und kann ein gebrauchtes Gerät als Inserat erfassen (Fotos, Zustand, Preis). Nach dem Absenden wird das Inserat geprüft und veröffentlicht.',
    suggestions: [
      'Wie mache ich gute Fotos für mein Inserat?',
      'Welchen Preis soll ich ansetzen?',
      'Was passiert nach dem Einstellen?',
    ],
    quickActions: [
      { label: 'Zum Marktplatz', href: P.marketplace },
      { label: 'Meine Inserate', href: DASH.listings },
    ],
  },
  {
    pattern: /^\/marketplace\/checkout\//,
    area: 'marketplace-checkout',
    description:
      'Die Nutzerin ist im Checkout eines Marktplatz-Inserats und schliesst gerade einen Kauf ab.',
    suggestions: [
      'Wie läuft die Bezahlung ab?',
      'Wie erhalte ich das Gerät?',
    ],
    quickActions: [{ label: 'Meine Bestellungen', href: DASH.orders }],
  },
  {
    pattern: /^\/marketplace\/[^/]+$/,
    area: 'marketplace-detail',
    description:
      'Die Nutzerin schaut sich ein einzelnes Marktplatz-Inserat an (Gerätedetails, Fotos, Preis, Verkäuferprofil) und kann den Verkäufer kontaktieren oder das Gerät kaufen.',
    suggestions: [
      'Worauf soll ich beim Kauf eines gebrauchten Geräts achten?',
      'Wie kontaktiere ich den Verkäufer?',
      'Gibt es eine Garantie?',
    ],
    quickActions: [{ label: 'Alle Inserate', href: P.marketplace }],
  },
  {
    pattern: /^\/marketplace/,
    area: 'marketplace',
    description:
      'Die Nutzerin ist auf der Marktplatz-Übersicht: refurbished Geräte von RevampIT und Inserate von Privatpersonen. Sie kann filtern, suchen, kaufen oder selbst ein Gerät verkaufen.',
    suggestions: [
      'Wie verkaufe ich ein Gerät?',
      'Was bedeutet «refurbished von RevampIT»?',
      'Wie finde ich einen günstigen Laptop?',
    ],
    quickActions: [
      { label: 'Gerät verkaufen', href: P.marketplaceSell },
      { label: 'Gerät spenden', href: P.donate },
    ],
  },
  {
    pattern: /^\/it-hilfe\/create/,
    area: 'it-hilfe-create',
    description:
      'Die Nutzerin erstellt gerade eine IT-Hilfe-Anfrage: Problem beschreiben, Kategorie und Budgetrahmen wählen. Techniker aus der Community melden sich danach mit Angeboten.',
    suggestions: [
      'Wie beschreibe ich mein Problem am besten?',
      'Was kostet eine Reparatur ungefähr?',
      'Wer sieht meine Anfrage?',
    ],
    quickActions: [{ label: 'Techniker ansehen', href: P.techniker }],
  },
  {
    pattern: /^\/it-hilfe\/techniker/,
    area: 'it-hilfe-techniker',
    description:
      'Die Nutzerin durchstöbert das Techniker-Verzeichnis der IT-Hilfe: Profile von Reparatur-Helfern aus der Community mit Bewertungen und Fachgebieten.',
    suggestions: [
      'Wie wähle ich den richtigen Techniker?',
      'Wie werde ich selbst Techniker?',
    ],
    quickActions: [
      { label: 'Anfrage erstellen', href: P.itHilfeCreate },
      { label: 'Techniker werden', href: P.profilTechniker },
    ],
  },
  {
    pattern: /^\/it-hilfe/,
    area: 'it-hilfe',
    description:
      'Die Nutzerin ist im IT-Hilfe-Bereich: Hier verbinden wir Menschen mit IT-Problemen und Community-Techniker, die bei Reparaturen und Support helfen.',
    suggestions: [
      'Wie funktioniert die IT-Hilfe?',
      'Mein Laptop startet nicht — was nun?',
      'Wie kann ich anderen helfen?',
    ],
    quickActions: [
      { label: 'Anfrage erstellen', href: P.itHilfeCreate },
      { label: 'Offene Anfragen', href: P.itHilfeBrowseRequests },
    ],
  },
  {
    pattern: /^\/workshops/,
    area: 'workshops',
    description:
      'Die Nutzerin schaut sich das Workshop-Angebot an: Linux-Grundlagen, Reparatur-Workshops und nachhaltige IT. Sie kann sich für Termine anmelden oder selbst einen Workshop vorschlagen.',
    suggestions: [
      'Welcher Workshop passt für Einsteiger?',
      'Wie melde ich mich an?',
      'Kann ich selbst einen Workshop anbieten?',
    ],
    quickActions: [{ label: 'Workshop vorschlagen', href: P.workshopsPropose }],
  },
  {
    pattern: /^\/get-involved/,
    area: 'get-involved',
    description:
      'Die Nutzerin ist im Mitmachen-Bereich: Geräte spenden, freiwillig mitarbeiten, Mitglied werden oder finanziell unterstützen. Gerätespenden sind der wichtigste Zufluss der Mission.',
    suggestions: [
      'Wie spende ich meinen alten Laptop?',
      'Was passiert mit gespendeten Geräten?',
      'Wie kann ich mithelfen?',
    ],
    quickActions: [
      { label: 'Gerät spenden', href: P.donate },
      { label: 'Mitglied werden', href: P.mitgliedWerden },
    ],
  },
  {
    pattern: /^\/projects\/upcycling/,
    area: 'projects-upcycling',
    description:
      'Die Nutzerin schaut sich das Upcycling-Projekt an: Aus defekten Monitoren werden Leuchten und andere Produkte — funktionelle Kreislaufnutzung von IT-Geräten.',
    suggestions: [
      'Wie entstehen die Upcycling-Leuchten?',
      'Kann ich eine Leuchte kaufen oder selber bauen?',
    ],
    quickActions: [{ label: 'Alle Projekte', href: '/projects' }],
  },
  {
    pattern: /^\/dashboard\/listings/,
    area: 'dashboard-listings',
    description:
      'Die Nutzerin verwaltet ihre eigenen Marktplatz-Inserate (Status, Bearbeitung, Verkäufe) in ihrem Dashboard.',
    suggestions: [
      'Warum ist mein Inserat noch nicht sichtbar?',
      'Wie bearbeite ich ein Inserat?',
    ],
    quickActions: [{ label: 'Neues Inserat', href: P.marketplaceSell }],
  },
  {
    pattern: /^\/dashboard\/orders/,
    area: 'dashboard-orders',
    description:
      'Die Nutzerin sieht ihre Käufe und Bestellungen auf dem Marktplatz in ihrem Dashboard.',
    suggestions: [
      'Wo sehe ich den Status meiner Bestellung?',
      'Wie kontaktiere ich den Verkäufer?',
    ],
    quickActions: [{ label: 'Zum Marktplatz', href: P.marketplace }],
  },
  {
    pattern: /^\/dashboard\/messages/,
    area: 'dashboard-messages',
    description:
      'Die Nutzerin ist in ihrem Nachrichten-Postfach und kommuniziert mit Käufern, Verkäufern oder Technikern.',
    suggestions: [
      'Wie antworte ich auf eine Anfrage?',
      'Warum erhalte ich keine Benachrichtigungen?',
    ],
  },
  {
    pattern: /^\/dashboard/,
    area: 'dashboard',
    description:
      'Die Nutzerin ist in ihrem persönlichen Dashboard mit Übersicht über Inserate, Bestellungen, Nachrichten und Workshop-Anmeldungen.',
    suggestions: [
      'Was kann ich hier alles tun?',
      'Wie verkaufe ich ein Gerät?',
    ],
    quickActions: [
      { label: 'Meine Inserate', href: DASH.listings },
      { label: 'Meine Bestellungen', href: DASH.orders },
    ],
  },
  {
    pattern: /^\/$/,
    area: 'home',
    description:
      'Die Nutzerin ist auf der Startseite von RevampIT und verschafft sich einen Überblick über das Angebot: Marktplatz, IT-Hilfe, Workshops, Spenden und Reparaturen.',
    suggestions: [
      'Was macht RevampIT genau?',
      'Wie kaufe ich einen günstigen Laptop?',
      'Wie spende ich ein Gerät?',
    ],
    quickActions: [
      { label: 'Marktplatz', href: P.marketplace },
      { label: 'IT-Hilfe', href: P.itHilfe },
      { label: 'Gerät spenden', href: P.donate },
    ],
  },
  // Generic fallback — MUST stay last.
  {
    pattern: /./,
    area: 'public-generic',
    description:
      'Die Nutzerin ist auf einer Seite der RevampIT-Plattform (gemeinnütziger Technologie-Austausch: Marktplatz, IT-Hilfe, Workshops, Spenden).',
    suggestions: [
      'Was bietet RevampIT an?',
      'Wie funktioniert der Marktplatz?',
      'Wo finde ich Hilfe bei IT-Problemen?',
    ],
    quickActions: [
      { label: 'Marktplatz', href: P.marketplace },
      { label: 'IT-Hilfe', href: P.itHilfe },
    ],
  },
]

// ---------------------------------------------------------------------------
// Admin surface — labels/descriptions derive from the sections SSOT
// ---------------------------------------------------------------------------

/** Build the LLM description from the section config so labels never fork. */
function adminDescription(sectionId: string, extra: string): string {
  const s = getSection(sectionId)
  const base = s ? `Der Admin-Bereich «${s.ui.label}»: ${s.ui.description}.` : ''
  return [base, extra].filter(Boolean).join(' ')
}

export const ADMIN_PAGE_CONTEXTS: HirnPageContext[] = [
  {
    pattern: /^\/admin\/approvals/,
    area: 'admin-approvals',
    description: adminDescription(
      'approvals',
      'Die Mitarbeiterin prüft eingereichte Inhalte (Inserate, Blogposts, Workshops, Techniker-Bewerbungen) und gibt sie frei oder lehnt sie ab.'
    ),
    suggestions: [
      'Nach welchen Kriterien gebe ich Inserate frei?',
      'Erstelle eine Aufgabe für offene Freigaben',
    ],
    quickActions: [{ label: 'Freigaben', href: ROUTES.admin.approvals }],
  },
  {
    pattern: /^\/admin\/(erfassung|intake)/,
    area: 'admin-erfassung',
    description: adminDescription(
      'erfassung',
      'Die Mitarbeiterin erfasst eingehende Geräte (Specs, Zustand, Fotos) für den RevampIT-Bestand; publizierte Geräte landen als Inserate im Marktplatz.'
    ),
    suggestions: [
      'Wie erfasse ich ein neues Gerät?',
      'Was passiert nach der Veröffentlichung?',
    ],
    quickActions: [
      { label: 'Erfassung', href: ROUTES.admin.erfassung },
      { label: 'Produkte', href: ROUTES.admin.products },
    ],
  },
  {
    pattern: /^\/admin\/marketplace/,
    area: 'admin-marketplace',
    description: adminDescription(
      'marketplace',
      'Die Mitarbeiterin verwaltet Marktplatz-Inserate: verifizieren, sperren, Meldungen bearbeiten.'
    ),
    suggestions: [
      'Wie verifiziere ich ein Inserat?',
      'Zeige mir gemeldete Inserate',
    ],
    quickActions: [{ label: 'Marketplace', href: ROUTES.admin.marketplace }],
  },
  {
    pattern: /^\/admin\/it-hilfe/,
    area: 'admin-it-hilfe',
    description: adminDescription(
      'it-hilfe-admin',
      'Die Mitarbeiterin betreut die IT-Hilfe: offene Anfragen, Angebote und Techniker-Profile im Blick behalten.'
    ),
    suggestions: [
      'Wie viele Anfragen sind offen?',
      'Wie funktioniert der IT-Hilfe-Ablauf?',
    ],
    quickActions: [{ label: 'IT-Hilfe', href: ROUTES.admin.itHilfe }],
  },
  {
    pattern: /^\/admin\/workshops/,
    area: 'admin-workshops',
    description: adminDescription(
      'workshops-admin',
      'Die Mitarbeiterin verwaltet Workshops: Vorschläge prüfen, Termine planen, Anmeldungen betreuen.'
    ),
    suggestions: [
      'Wie plane ich einen neuen Workshop-Termin?',
      'Erstelle eine Aufgabe zur Workshop-Planung',
    ],
    quickActions: [{ label: 'Workshops', href: ROUTES.admin.workshops }],
  },
  {
    pattern: /^\/admin\/tasks/,
    area: 'admin-tasks',
    description: adminDescription(
      'tasks',
      'Die Mitarbeiterin arbeitet mit dem Aufgaben-Board: Aufgaben erstellen, zuweisen und abschliessen.'
    ),
    suggestions: [
      'Erstelle eine Aufgabe',
      'Welche Aufgaben sind mir zugewiesen?',
    ],
    quickActions: [{ label: 'Neue Aufgabe', href: ROUTES.admin.taskNew }],
  },
  {
    pattern: /^\/admin\/protocols/,
    area: 'admin-protocols',
    description: adminDescription(
      'protocols',
      'Die Mitarbeiterin verwaltet Sitzungsprotokolle: erfassen, nachlesen, Beschlüsse dokumentieren.'
    ),
    suggestions: [
      'Erstelle einen Protokoll-Entwurf',
      'Was stand im letzten Protokoll?',
    ],
    quickActions: [{ label: 'Neues Protokoll', href: ROUTES.admin.protocolNew }],
  },
  {
    pattern: /^\/admin\/decisions/,
    area: 'admin-decisions',
    description: adminDescription(
      'decisions',
      'Die Mitarbeiterin arbeitet mit Team-Entscheidungen: Vorschläge einbringen, abstimmen, Ergebnisse dokumentieren.'
    ),
    suggestions: [
      'Erstelle einen Entscheidungs-Entwurf',
      'Welche Entscheidungen sind offen?',
    ],
    quickActions: [{ label: 'Neue Entscheidung', href: ROUTES.admin.decisionNew }],
  },
  {
    pattern: /^\/admin\/(team|timecards|zeiterfassung|payroll|hr)/,
    area: 'admin-team',
    description: adminDescription(
      'team',
      'Die Mitarbeiterin ist im Team-/HR-Bereich: Teammitglieder, Zeitkarten, Zeiterfassung und Bewerbungen.'
    ),
    suggestions: [
      'Wie funktioniert der Zeitkarten-Ablauf?',
      'Welche Zeitkarten warten auf Freigabe?',
    ],
    quickActions: [{ label: 'Team', href: ROUTES.admin.team }],
  },
  {
    pattern: /^\/admin\/analyse/,
    area: 'admin-analyse',
    description: adminDescription(
      'analyse-hub',
      'Die Mitarbeiterin schaut sich Auswertungen an: Kennzahlen, Finanzen und Wirkungszahlen der Organisation.'
    ),
    suggestions: [
      'Wie berechnen wir unsere CO₂-Einsparung?',
      'Erkläre die wichtigsten Kennzahlen',
    ],
    quickActions: [{ label: 'Analyse', href: ROUTES.admin.analyse }],
  },
  {
    pattern: /^\/admin\/?$/,
    area: 'admin-dashboard',
    description: adminDescription(
      'dashboard',
      'Die Mitarbeiterin ist auf der Admin-Startseite mit Übersicht über alle Bereiche.'
    ),
    suggestions: [
      'Was gibt es heute zu tun?',
      'Erstelle eine Aufgabe',
      'Wie viele Geräte haben wir dieses Jahr verkauft?',
    ],
    quickActions: [
      { label: 'Aufgaben', href: ROUTES.admin.tasks },
      { label: 'Freigaben', href: ROUTES.admin.approvals },
    ],
  },
  // Generic fallback — MUST stay last.
  {
    pattern: /./,
    area: 'admin-generic',
    description:
      'Die Mitarbeiterin ist im Admin-Bereich der RevampIT-Plattform.',
    suggestions: [
      'Erstelle eine Aufgabe',
      'Was weisst du über RevampIT?',
    ],
    quickActions: [{ label: 'Admin-Übersicht', href: ROUTES.admin.dashboard }],
  },
]

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/** Strips the locale prefix (/en/marketplace → /marketplace). */
const LOCALE_PREFIX = new RegExp(`^/(${locales.join('|')})(?=/|$)`)

/**
 * Resolve the page context for a pathname. First regex match wins; the
 * last entry of each list is a catch-all, so this always returns a context.
 */
export function resolveHirnContext(
  pathname: string,
  surface: 'public' | 'admin'
): HirnPageContext {
  const path = pathname.replace(LOCALE_PREFIX, '') || '/'
  const contexts = surface === 'admin' ? ADMIN_PAGE_CONTEXTS : PUBLIC_PAGE_CONTEXTS
  return contexts.find(c => c.pattern.test(path)) ?? contexts[contexts.length - 1]
}
