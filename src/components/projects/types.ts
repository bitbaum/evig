import type { LucideIcon } from 'lucide-react'

// ── Shared translation-layer types ────────────────────────────────────────────
// Used in every project page to type the raw t.raw() output before mapping.

export type RawCard = { title: string; description?: string; features?: string[] }
export type RawAction = { title: string; description: string; cta: string }

// ── Component types ───────────────────────────────────────────────────────────

export interface ProjectCTA {
  text: string
  href: string
  variant?: 'primary' | 'outline'
}

export interface ProjectHero {
  title: string
  description: string
  icon?: LucideIcon
  ctas?: ProjectCTA[]
}

export interface ProjectCard {
  title: string
  description: string
  icon?: LucideIcon
  features?: string[]
  href?: string
  ctaText?: string
}

export interface ProjectSection {
  title?: string
  description?: string
  cards?: ProjectCard[]
  backgroundColor?: 'white' | 'gray'
  layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'single'
}

export interface ProjectCTASection {
  title: string
  subtitle?: string
  actions: Array<{
    title: string
    description: string
    href: string
    ctaText: string
  }>
}

export interface ProjectPageConfig {
  /**
   * Optional — pages that render a bespoke hero (e.g. /projects/upcycling
   * with its cinematic spectrum composition) omit this and render their
   * own hero component above the section list.
   */
  hero?: ProjectHero
  sections: ProjectSection[]
  cta?: ProjectCTASection
  metadata: {
    title: string
    description: string
  }
}
