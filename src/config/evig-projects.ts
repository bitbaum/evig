/**
 * evig Projects showcase — SINGLE SOURCE OF TRUTH for the `/projects` section.
 *
 * evig doesn't just run a platform — it builds tools and ships them, mostly
 * open-source. This array IS the whole showcase: the `/projects` index, each
 * `/projects/<slug>` detail page, the nav entry, and the sitemap all derive from
 * it. (Distinct from `config/projects.ts`, which holds the admin
 * project-contributions enums — a different feature.)
 *
 * ── To add a project ──────────────────────────────────────────────────────
 *   1. Append one entry below (slug + name + status + icon + links).
 *   2. Add its human strings under `projects.items.<slug>` in messages/de.json
 *      (tagline + description), then translate. Structure lives HERE, strings in
 *      messages — paired by the stable `slug` key (never by array index).
 * The index card, detail page, nav link, and sitemap entry all update on their own.
 */

import { Boxes, type LucideIcon } from 'lucide-react'

export type ProjectStatus = 'live' | 'beta' | 'building' | 'planned'

export interface EvigProject {
  /** URL slug AND the stable i18n key under `projects.items.<slug>`. */
  slug: string
  /** Brand name — a proper noun, stays literal across all locales. */
  name: string
  /** Lifecycle stage → status badge (label from i18n, style from the map below). */
  status: ProjectStatus
  /** Section icon (lucide). */
  icon: LucideIcon
  /** Public source repository, if the project is open. */
  repoUrl?: string
  /** Live product URL, if deployed. */
  liveUrl?: string
  /** SPDX license id, for open-source projects. */
  license?: string
}

export const EVIG_PROJECTS: EvigProject[] = [
  {
    slug: 'kivvi',
    name: 'Kivvi',
    status: 'live',
    icon: Boxes,
    repoUrl: 'https://github.com/bitbaum/kivvi',
    license: 'MIT',
  },
]

/**
 * Status-badge styling — semantic palette scales (never arbitrary hex), with
 * dark variants so the pill stays legible in both themes. Same convention as the
 * kennzahlen confidence badges.
 */
export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  live: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  beta: 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-300',
  building: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  planned: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
}

/** Look up a project by slug (detail page + validation). */
export function getEvigProject(slug: string): EvigProject | undefined {
  return EVIG_PROJECTS.find((p) => p.slug === slug)
}

/** All slugs — for `generateStaticParams` and the sitemap. */
export function getEvigProjectSlugs(): string[] {
  return EVIG_PROJECTS.map((p) => p.slug)
}
