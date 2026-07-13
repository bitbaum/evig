import {
  HandHeart,
  ClipboardCheck,
  ShieldCheck,
  Wrench,
  BadgeCheck,
  Home,
  Recycle,
  Puzzle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * "Der Weg deines Geräts" — SSOT for the language-independent STRUCTURE of the
 * donation→refurbish→rehome story. Only translatable strings live in the message
 * files (keyed by id under `soFunktioniert.*`); the structural facts here (id,
 * icon, ordering) are never duplicated into locale files — the page maps over
 * these arrays and pulls strings by id (same pattern as projects/data.ts).
 *
 * The FACTS this page states (NIST 800-88 wipe, SWICO recycling, Linux install,
 * 6-month warranty, condition grading) all trace to existing SSOTs
 * (config/intake-checklist.ts, REVAMPIT_GUARANTEE, config/erfassung/conditions)
 * — nothing here is invented.
 */

export interface JourneyPhase {
  id: string
  icon: LucideIcon
}

/** The device journey, in order. Strings: soFunktioniert.phases.{id}.{title,body}. */
export const JOURNEY_PHASES: JourneyPhase[] = [
  { id: 'donation', icon: HandHeart },
  { id: 'intake', icon: ClipboardCheck },
  { id: 'wipe', icon: ShieldCheck },
  { id: 'refurbish', icon: Wrench },
  { id: 'quality', icon: BadgeCheck },
  { id: 'rehome', icon: Home },
]

export interface OutcomePath {
  id: string
  icon: LucideIcon
}

/**
 * Not every donation is resold — the three-tier cascade (mirrors INTAKE_TIERS in
 * config/intake-checklist.ts). Strings: soFunktioniert.paths.{id}.{title,body}.
 */
export const OUTCOME_PATHS: OutcomePath[] = [
  { id: 'refurbish', icon: Wrench },
  { id: 'parts', icon: Puzzle },
  { id: 'recycle', icon: Recycle },
]
