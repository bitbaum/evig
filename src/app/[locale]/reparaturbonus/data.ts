import {
  Banknote,
  Percent,
  Boxes,
  CalendarClock,
  MapPin,
  Search,
  Wrench,
  CircleDollarSign,
  Laptop,
  Shirt,
  Sparkles,
  Cpu,
  Recycle,
  Leaf,
  Ticket,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Reparaturbonus Zürich — SSOT for the language-independent STRUCTURE and the
 * verifiable FACTS of this page. Only translatable strings live in the message
 * files (keyed by id under `reparaturbonus.*`); the structural facts here (id,
 * icon, ordering) and the numeric programme facts (REPARATURBONUS) are never
 * duplicated into locale files — the page maps over these arrays and pulls
 * strings by id, and interpolates the figures via ICU args.
 *
 * Every figure below is a fact of the CITY OF ZÜRICH programme (not a RevampIT
 * metric — so it is content, not an org-numbers stat) and traces to the sources
 * in REPARATURBONUS.sources. Do not invent numbers here.
 *
 * Sources (verified 2026-07-20):
 * - Stadt Zürich, Reparaturförderung mit Reparaturbonus (ERZ)
 * - Flick-it.ch (reparaturbonus.stzh.ch) — the official repair platform
 * - NZZ / 20 Minuten coverage of the launch (10.07.2026)
 */
export const REPARATURBONUS = {
  /** Maximum bonus per person per calendar year, in CHF. */
  maxBonusChf: 100,
  /** Share of the repair invoice the bonus covers, in percent. */
  coveragePercent: 50,
  /** Pilot duration in years. */
  pilotYears: 3,
  /** Launch date of the pilot (ISO). */
  launchDate: '2026-07-10',
  /** Expected number of supported repairs over the pilot. */
  expectedRepairs: 40000,
  /** Expected CO₂-equivalent savings over the pilot, in tonnes. */
  expectedCo2Tonnes: 960,
  /** Total programme budget over the pilot, in CHF millions. */
  budgetChfMillions: 3.9,
  /** The official repair platform. */
  platformName: 'Flick-it.ch',
  platformUrl: 'https://www.flick-it.ch',
  /** Public information page run by the city (ERZ). */
  cityInfoUrl:
    'https://www.stadt-zuerich.ch/de/umwelt-und-energie/klima/kreislaufwirtschaft/reparaturfoerderung.html',
  /** Registration page for repair businesses. */
  businessRegistrationUrl:
    'https://www.stadt-zuerich.ch/de/umwelt-und-energie/klima/kreislaufwirtschaft/reparaturfoerderung/registrierung-reparaturbetriebe.html',
} as const

export interface IconItem {
  id: string
  icon: LucideIcon
}

/** The four headline figures. Strings: reparaturbonus.facts.{id}.{value,label,detail}. */
export const KEY_FACTS: IconItem[] = [
  { id: 'bonus', icon: Banknote },
  { id: 'coverage', icon: Percent },
  { id: 'categories', icon: Boxes },
  { id: 'pilot', icon: CalendarClock },
]

/** How a resident uses the bonus, in order. Strings: reparaturbonus.steps.{id}.{title,body}. */
export const STEPS: IconItem[] = [
  { id: 'residence', icon: MapPin },
  { id: 'find', icon: Search },
  { id: 'repair', icon: Wrench },
  { id: 'redeem', icon: CircleDollarSign },
]

/** What qualifies at pilot start. Strings: reparaturbonus.eligible.{id}.{title,body}. */
export const ELIGIBLE: IconItem[] = [
  { id: 'electronics', icon: Laptop },
  { id: 'textiles', icon: Shirt },
  { id: 'more', icon: Sparkles },
]

/** Why repairs at Revamp-IT fit the bonus. Strings: reparaturbonus.fit.{id}.{title,body}. */
export const REVAMPIT_FIT: IconItem[] = [
  { id: 'category', icon: Cpu },
  { id: 'location', icon: MapPin },
  { id: 'mission', icon: Recycle },
]

/** Context / impact of the programme. Strings: reparaturbonus.impact.{id}.{title,body}. */
export const IMPACT: IconItem[] = [
  { id: 'coupons', icon: Ticket },
  { id: 'repairs', icon: Wrench },
  { id: 'climate', icon: Leaf },
]

/** FAQ entries. Strings: reparaturbonus.faq.{id}.{q,a}. */
export const FAQ_IDS = ['who', 'howMuch', 'carryOver', 'what', 'devices', 'revampit'] as const
