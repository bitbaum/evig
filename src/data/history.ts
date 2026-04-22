/**
 * RevampIT History & Timeline Data
 *
 * Single source of truth for organizational history and milestones.
 * Used for the Geschichte (history) section and about pages.
 */

import { getDefaultNumeric, getDefaultValue } from '@/lib/org-numbers.defaults'
import { ORG, LOCATIONS } from '@/config/org'

export interface Milestone {
  year: number
  title: string
  description: string
  type: 'founding' | 'growth' | 'achievement' | 'expansion' | 'community'
  highlight?: boolean
}

export interface FoundingStory {
  title: string
  subtitle: string
  paragraphs: string[]
}

export interface HistoryConfig {
  founding: FoundingStory
  milestones: Milestone[]
  currentState: {
    teamSize: number
    location: string
    yearsActive: number
    devicesPerYear: string
  }
}

/**
 * RevampIT History Configuration
 */
export const HISTORY_CONFIG: HistoryConfig = {
  founding: {
    title: `Die Gründung von ${ORG.name}`,
    subtitle: 'Vom Käsekeller zur Bewegung',
    paragraphs: [
      `${ORG.name} wurde im Dezember ${ORG.foundingYear} in Zürich gegründet – geboren aus einer einfachen Beobachtung: Immer mehr brauchbare Computer landeten im Müll. "Da muss etwas passieren", war der Gedanke, der alles ins Rollen brachte.`,
      'Der erste Standort war ein alter Käsekeller in der Toni Molkerei. Dort entstand die Idee, die bis heute trägt: Hardware-Recycling und Linux kombinieren. Denn mit Open-Source-Software funktionieren auch ältere Geräte noch jahrelang.',
      'Was als kleines Projekt begann, wurde zur Bewegung. Ohne gross nach Leuten zu suchen, kamen immer wieder Menschen dazu, die sagten: "Toll, was ihr da macht." Heute, über 20 Jahre später, verarbeiten wir jährlich rund 1000 Geräte – davon werden etwa 150 aufbereitet und verkauft, der Rest geht in Ersatzteilgewinnung und fachgerechtes Recycling.',
    ],
  },

  milestones: [
    {
      year: 2003,
      title: 'Gründung',
      description:
        `${ORG.name} wird in der Toni Molkerei in Zürich gegründet – in einem alten Käsekeller. Die Vision: Brauchbare Computer vor dem Müll retten.`,
      type: 'founding',
      highlight: true,
    },
    {
      year: 2004,
      title: 'Erste Projekte',
      description:
        'Linux-Workshops und erste Afrika-Projekte starten. Die Kombination von Hardware-Recycling und Open Source zeigt ihre Stärke.',
      type: 'community',
    },
    {
      year: 2005,
      title: 'Debian-Jubiläum',
      description:
        '10-jähriges Debian-Jubiläum auf dem Dach der Toni Molkerei. Die Open-Source-Community wächst zusammen.',
      type: 'community',
    },
    {
      year: 2008,
      title: 'Umzug nach Wipkingen',
      description:
        'Neue Räume in der Reformierten Kirche Wipkingen. Mehr Platz für Werkstatt und wachsendes Team.',
      type: 'expansion',
      highlight: true,
    },
    {
      year: 2012,
      title: 'Wachstum',
      description:
        'Röschibachstrasse – mehr Raum, mehr Möglichkeiten. Das Team wächst und die Nachfrage steigt.',
      type: 'growth',
    },
    {
      year: 2015,
      title: 'Zwei Standorte',
      description:
        `Laden an der ${LOCATIONS.store.street}, Lager an der ${LOCATIONS.warehouse.street}. ${ORG.name} etabliert sich im Quartier.`,
      type: 'expansion',
    },
    {
      year: 2017,
      title: 'Neue Räumlichkeiten',
      description:
        `Umzug in die ehemalige Bank an der ${LOCATIONS.store.street}. Mehr Platz für Werkstatt, Laden und Community.`,
      type: 'expansion',
      highlight: true,
    },
    {
      year: 2020,
      title: 'Digital trotz Pandemie',
      description:
        'Während der Pandemie helfen wir Schulen und Familien mit günstigen Laptops für Homeschooling. Online-Workshops starten.',
      type: 'community',
    },
    {
      year: 2022,
      title: 'Hosting & Cloud-Services',
      description:
        'Erweiterung um Schweizer Cloud- und Hosting-Services. Datensouveränität für KMU, die ihre Daten in der Schweiz behalten wollen.',
      type: 'expansion',
    },
    {
      year: 2024,
      title: '21 Jahre nachhaltige IT',
      description:
        `Rund 1000 Geräte pro Jahr verarbeitet, davon ~150 verkauft. Über 43 Tonnen CO₂ pro Jahr eingespart. ~40% Erfolgsquote bei Praktika. ${ORG.name} ist Vorbild für nachhaltige IT in der Schweiz.`,
      type: 'achievement',
      highlight: true,
    },
  ],

  currentState: {
    teamSize: getDefaultNumeric('team_size_community'),
    location: LOCATIONS.store.full,
    yearsActive: new Date().getFullYear() - getDefaultNumeric('founding_year'),
    devicesPerYear: getDefaultValue('devices_processed_per_year'),
  },
}

/**
 * Get highlighted milestones only
 */
export function getHighlightedMilestones(): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.highlight)
}

/**
 * Get milestones by type
 */
export function getMilestonesByType(type: Milestone['type']): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.type === type)
}

/**
 * Get milestones for a specific year range
 */
export function getMilestonesInRange(startYear: number, endYear: number): Milestone[] {
  return HISTORY_CONFIG.milestones.filter((m) => m.year >= startYear && m.year <= endYear)
}
