/**
 * Changelog — SSOT for platform release notes.
 *
 * Add a new entry at the top after each meaningful deploy. Keep bullets
 * concise and user-facing (fixes, features, improvements). UI chrome lives
 * in messages/partials/changelog.{locale}.json; release copy lives here.
 */

export interface LocalizedCopy {
  de: string
  en: string
}

export interface ChangelogRelease {
  /** Anchor id, e.g. "v0-1-0" */
  id: string
  version: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  title: LocalizedCopy
  changes: LocalizedCopy[]
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'v0-1-1',
    version: '0.1.1',
    date: '2026-06-16',
    title: {
      de: 'Homepage- und Marktplatz-Hierarchie neu ausgerichtet',
      en: 'Homepage and marketplace hierarchy realigned',
    },
    changes: [
      {
        de: 'Homepage-CTAs von Geräte-Spenden auf Refurbished-Kauf und Reparatur-Suche umgestellt',
        en: 'Homepage CTAs moved from device donation to refurbished purchasing and repair discovery',
      },
      {
        de: 'Marktplatz-Mega-Menü priorisiert jetzt Shop, Community-Inserate, Techniker-Suche und Hilfe anfragen vor Angebots-/Mitmach-Pfaden',
        en: 'Marketplace mega menu now prioritizes shop, community listings, technician search, and help requests before supply/contribution paths',
      },
      {
        de: 'IT-Hilfe-Hub startet mit Techniker- und Werkstatt-Suche statt zuerst mit dem Anfrageformular',
        en: 'IT-Hilfe hub now starts with technician and workshop discovery instead of the request form',
      },
      {
        de: 'Blog-Rationale dokumentiert die Business-, Design- und Engineering-Entscheidung hinter der neuen Informationshierarchie',
        en: 'Blog rationale documents the business, design, and engineering decision behind the new information hierarchy',
      },
    ],
  },
  {
    id: 'v0-1-0',
    version: '0.1.0',
    date: '2026-06-15',
    title: {
      de: 'RevampIT Plattform 0.1.0',
      en: 'RevampIT Platform 0.1.0',
    },
    changes: [
      {
        de: 'Design-System-Migration abgeschlossen: Admin- und Dashboard-Oberflächen nutzen durchgängig semantische Tokens und card-shell',
        en: 'Design system migration complete: admin and dashboard surfaces now use semantic tokens and card-shell throughout',
      },
      {
        de: 'Legacy-CSS-Aliase entfernt — globals.css ist alleinige Quelle für Surface-, Text- und Akzent-Tokens',
        en: 'Removed legacy CSS aliases — globals.css is now the sole source for surface, text, and accent tokens',
      },
      {
        de: 'ESLint-Design-Regeln projektweit auf error: keine rohen Buttons/Inputs ausserhalb des UI-Kits',
        en: 'Project-wide ESLint design rules set to error: no raw buttons/inputs outside the UI kit',
      },
      {
        de: 'Overlay-Schatten auf shadow-xs vereinheitlicht; statische Karten ohne shadow-lg',
        en: 'Unified overlay shadows to shadow-xs; static cards no longer use shadow-lg',
      },
    ],
  },
  {
    id: 'v0-0-9',
    version: '0.0.9',
    date: '2026-06-14',
    title: {
      de: 'RevampIT Plattform 0.0.9',
      en: 'RevampIT Platform 0.0.9',
    },
    changes: [
      {
        de: 'ui-public-* Utilities auf Marketing-, Shop- und IT-Hilfe-Seiten ausgerollt',
        en: 'Rolled out ui-public-* utilities across marketing, shop, and IT-Hilfe pages',
      },
      {
        de: 'Semantische Design-Tokens für öffentliche Oberflächen — keine hardcodierten neutral-* Klassen mehr',
        en: 'Semantic design tokens on public surfaces — no more hardcoded neutral-* classes',
      },
      {
        de: 'Self-Host-Deploy-Skript und GitHub-Actions-Workflow für Hetzner dokumentiert',
        en: 'Self-host deploy script and GitHub Actions workflow for Hetzner documented',
      },
    ],
  },
  {
    id: 'v0-0-8',
    version: '0.0.8',
    date: '2026-06-10',
    title: {
      de: 'RevampIT Plattform 0.0.8',
      en: 'RevampIT Platform 0.0.8',
    },
    changes: [
      {
        de: 'Upcycling-Mini-Site refactoriert mit Scroll-Spy-Inhaltsverzeichnis auf dem Businessplan',
        en: 'Refactored upcycling mini-site with scroll-spy table of contents on the business plan',
      },
      {
        de: 'Navigation i18n-Fix: Projekte-Mega-Menü zeigt übersetzte Labels statt roher Schlüssel',
        en: 'Navigation i18n fix: projects mega-menu shows translated labels instead of raw keys',
      },
      {
        de: 'Techniker-Profilseiten und öffentliche Techniker-Liste überarbeitet',
        en: 'Technician profile pages and public technician list refreshed',
      },
      {
        de: 'Pro-Seiten og:image für Upcycling-Unterseiten — Social Shares zeigen Vorschaubilder',
        en: 'Per-page og:image for upcycling subpages — social shares now show preview images',
      },
    ],
  },
  {
    id: 'v0-0-7',
    version: '0.0.7',
    date: '2026-06-05',
    title: {
      de: 'RevampIT Plattform 0.0.7',
      en: 'RevampIT Platform 0.0.7',
    },
    changes: [
      {
        de: 'Admin-Protokoll-Votes werden in Tasks überführt; Legacy-Voting entfernt',
        en: 'Admin protocol votes now bridge into tasks; legacy voting removed',
      },
      {
        de: 'Task-Analytics-Seite entfernt; Task-Erstellungsformular komprimiert',
        en: 'Removed task analytics page; compressed task creation form',
      },
      {
        de: 'Auth-Dokumentation und Dashboard-Onboarding an live JWT-Stack angeglichen',
        en: 'Auth documentation and dashboard onboarding aligned with live JWT stack',
      },
    ],
  },
  {
    id: 'v0-0-6',
    version: '0.0.6',
    date: '2026-05-28',
    title: {
      de: 'RevampIT Plattform 0.0.6',
      en: 'RevampIT Platform 0.0.6',
    },
    changes: [
      {
        de: 'Erfassungs-Quick-Entry Hover-Klassen repariert',
        en: 'Fixed malformed quick-entry hover classes in device intake (Erfassung)',
      },
      {
        de: 'Admin-Interaktions-Hover auf SSOT-Utilities vereinheitlicht',
        en: 'Unified admin interactive hovers to SSOT utilities',
      },
      {
        de: 'Tasks-Standardfilter und Inline-Aktionen konsolidiert',
        en: 'Consolidated tasks default filter and inline actions',
      },
    ],
  },
]
