/**
 * evig divisions — SINGLE SOURCE OF TRUTH for the brand architecture.
 *
 * evig is one organisation with several divisions, and they are one idea told
 * at rising scale: keep something useful for longer.
 *
 *   computers    → the machine, curated so it lasts instead of landfilling
 *   repairs      → the machine someone already owns, kept alive
 *   ai           → the intelligence that machine can reach
 *
 * This array IS the brand architecture: the homepage section, the footer
 * column, the nav entries and the division pages all derive from it, including
 * the count in the section heading. `computers` and `repairs` point at the
 * surfaces that already serve them (marketplace, IT-Hilfe) — a division is a
 * lens on the org, not a duplicate storefront.
 *
 * ── To add or move a division ────────────────────────────────────────────
 *   1. Edit the entry below (structure only: id, href, icon, theme, status).
 *   2. Add its human strings under `divisions.items.<id>` in messages/de.json,
 *      then translate. Structure lives HERE, strings in messages — paired by
 *      the stable `id` key, never by array index (see the i18n SSOT rule).
 *   3. A division that needs a page of its own gets a DIVISION_PAGES entry.
 */

import { Laptop, Sparkles, Wrench, type LucideIcon } from 'lucide-react'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import type { ThemeKey } from '@/lib/design/tokens'

export type DivisionId = 'computers' | 'repairs' | 'ai'

/**
 * How far a division actually is.
 *
 * `research` is a hard claim-limiter, not a roadmap tease: it means there is
 * nothing to buy, nothing is promised, and the page says so out loud. evig
 * states no capability it has not earned (see .claude/CLAUDE.md).
 */
export type DivisionStatus = 'live' | 'research'

export interface Division {
  /** URL-safe id AND the stable i18n key under `divisions.items.<id>`. */
  id: DivisionId
  /** Full wordmark ("evig health") — composed from ORG.name, never hardcoded. */
  wordmark: string
  /** Where the division's work actually lives today. */
  href: string
  /** Section icon (lucide). */
  icon: LucideIcon
  /** Section theme for hero + icon badge. */
  theme: ThemeKey
  status: DivisionStatus
}

/** The wordmark is the org name plus the division id — one brand, four lenses. */
const wordmark = (id: DivisionId): string => `${ORG.name} ${id}`

export const EVIG_DIVISIONS: readonly Division[] = [
  {
    id: 'computers',
    wordmark: wordmark('computers'),
    href: ROUTES.public.marketplace,
    icon: Laptop,
    theme: 'marketplace',
    status: 'live',
  },
  {
    id: 'repairs',
    wordmark: wordmark('repairs'),
    href: ROUTES.public.itHilfe,
    icon: Wrench,
    theme: 'itHilfe',
    status: 'live',
  },
  {
    id: 'ai',
    wordmark: wordmark('ai'),
    href: ROUTES.public.ai,
    icon: Sparkles,
    theme: 'ai',
    status: 'live',
  },
]

/**
 * Status-badge styling — semantic palette scales (never arbitrary hex), with
 * dark variants so the pill stays legible in both themes. Same convention as
 * PROJECT_STATUS_STYLE.
 */
export const DIVISION_STATUS_STYLE: Record<DivisionStatus, string> = {
  live: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  research: 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-300',
}

/**
 * Divisions that own a page of their own. `computers` and `repairs` are absent
 * on purpose — they route to the marketplace and IT-Hilfe surfaces that already
 * do the job, and a second landing page for either would be drift.
 */
export type DivisionPageId = Extract<DivisionId, 'ai'>

export interface DivisionPageConfig {
  /** Ordered strand ids → `divisions.pages.<id>.strands.<strandId>.{title,body}`. */
  strands: readonly string[]
  /**
   * Strand id → where the reader acts on what that strand describes.
   *
   * A strand that names something the user can do today but gives them no way
   * to reach it is a dead end — the contextual-links rule in CLAUDE.md. Strands
   * that are a statement rather than an offer simply have no entry here; the
   * link text comes from `strands.<id>.link` in the messages.
   */
  strandLinks?: Readonly<Record<string, string>>
  /**
   * Ordered honesty-boundary ids → `divisions.pages.<id>.boundary.<id>`.
   * Every division page states what it is NOT; that block is required, not
   * decorative, and it is what keeps an ambitious claim honest.
   */
  boundaries: readonly string[]
  /** Where the closing CTA points. */
  ctaHref: string
}

export const DIVISION_PAGES: Record<DivisionPageId, DivisionPageConfig> = {
  ai: {
    strands: ['assistant', 'sharing', 'hardware', 'sovereignty'],
    strandLinks: {
      sharing: ROUTES.public.abos,
      hardware: ROUTES.public.marketplace,
    },
    boundaries: ['noLab', 'noMagic', 'noLockIn'],
    ctaHref: ROUTES.public.marketplace,
  },
}

/** Look up a division by id (page metadata + validation). */
export function getDivision(id: DivisionId): Division | undefined {
  return EVIG_DIVISIONS.find((d) => d.id === id)
}

/** Narrow a division to one that owns a page — the division-page components need both halves. */
export function getDivisionPage(id: DivisionPageId): Division & { id: DivisionPageId } {
  const division = getDivision(id)
  if (!division) throw new Error(`Unknown evig division: ${id}`)
  return { ...division, id }
}
