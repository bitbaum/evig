/**
 * RevampIT History & Timeline Data
 *
 * Structure-only SSOT for the history timeline: year, milestone type and the
 * highlight flag. The human-readable strings (founding story + each year's
 * title/description) live in messages under `components.geschichteSection`, so
 * every locale is translated instead of falling back to German. Structure here,
 * strings in messages — see `GeschichteSection.tsx`.
 */

import { getDefaultNumeric, getDefaultValue } from '@/lib/org-numbers.defaults'
import { LOCATIONS } from '@/config/org'

export interface Milestone {
  year: number
  type: 'founding' | 'growth' | 'achievement' | 'expansion' | 'community'
  highlight?: boolean
}

export interface HistoryConfig {
  milestones: Milestone[]
  currentState: {
    teamSize: number
    location: string
    yearsActive: number
    devicesPerYear: string
  }
}

export const HISTORY_CONFIG: HistoryConfig = {
  milestones: [
    { year: 2003, type: 'founding', highlight: true },
    { year: 2004, type: 'community' },
    { year: 2005, type: 'community' },
    { year: 2008, type: 'expansion', highlight: true },
    { year: 2012, type: 'growth' },
    { year: 2015, type: 'expansion' },
    { year: 2017, type: 'expansion', highlight: true },
    { year: 2020, type: 'community' },
    { year: 2022, type: 'expansion' },
    { year: 2024, type: 'achievement', highlight: true },
  ],

  currentState: {
    teamSize: getDefaultNumeric('team_size_community'),
    location: LOCATIONS.store.full,
    yearsActive: new Date().getFullYear() - getDefaultNumeric('founding_year'),
    devicesPerYear: getDefaultValue('devices_processed_per_year'),
  },
}

/** Get highlighted milestones only. */
export function getHighlightedMilestones(): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.highlight)
}

/** Get milestones by type. */
export function getMilestonesByType(type: Milestone['type']): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.type === type)
}

/** Get milestones within a year range (inclusive). */
export function getMilestonesInRange(startYear: number, endYear: number): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.year >= startYear && m.year <= endYear)
}
