import { Code, Globe, Layers, Users, Wrench, Server, Lightbulb, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Public projects showcase — SSOT for the language-independent structure of
 * each project.
 *
 * Only translatable strings (title / description / features) live in the
 * message files, keyed by slug under `projects.items.{slug}`. The structural
 * facts below (slug, category, status, year, icon) are NOT translatable and
 * must never be duplicated into the locale files — doing so previously let
 * translators corrupt slugs/categories (breaking /projects/{slug} links and the
 * category filter) in several locales. The page maps over this array (canonical
 * order + structure) and pulls only the translatable strings by slug.
 */

export type ProjectCategory = 'software' | 'hardware' | 'community'
export type ProjectStatus = 'active' | 'ongoing'

export interface ProjectConfig {
  slug: string
  category: ProjectCategory
  status: ProjectStatus
  year: string
  icon: LucideIcon
  /** For products with their own landing (e.g. Saldo): the card links here
   *  instead of the /projects/{slug} detail page. Non-localized absolute path. */
  externalHref?: string
  /** A product's brand name (a proper noun — same in every language). When set,
   *  it is the card title, so the name lives HERE, not scattered across the
   *  locale files. Rebrand in one place. */
  brandName?: string
}

/** Translatable strings for a project — `projects.items[]` (canonical order). */
export interface ProjectStrings {
  title: string
  description: string
  features: string[]
}

/** A project's config merged with its translated strings, ready to render. */
export type ProjectView = ProjectConfig & ProjectStrings

/** Filter categories in display order. */
export const PROJECT_CATEGORIES: ProjectCategory[] = ['software', 'hardware', 'community']

export const PROJECTS: ProjectConfig[] = [
  { slug: 'kivitendo',     category: 'software',  status: 'active',  year: '2015', icon: Code },
  { slug: 'linuxola',      category: 'community', status: 'active',  year: '2005', icon: Globe },
  { slug: 'freiecomputer', category: 'community', status: 'active',  year: '2010', icon: Layers },
  { slug: 'compirat',      category: 'community', status: 'active',  year: '2018', icon: Users },
  { slug: 'hardware',      category: 'hardware',  status: 'ongoing', year: '2020', icon: Wrench },
  { slug: 'ltsp',          category: 'software',  status: 'active',  year: '2016', icon: Server },
  { slug: 'upcycling',     category: 'hardware',  status: 'ongoing', year: '2025', icon: Lightbulb },
  { slug: 'saldo',         category: 'software',  status: 'active',  year: '2026', icon: Scale, externalHref: '/saldo', brandName: 'Saldo' },
]
