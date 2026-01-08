/**
 * RevampIT History & Timeline Data
 *
 * Single source of truth for organizational history and milestones.
 * Used for the Geschichte (history) section and about pages.
 */

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
  }
}

/**
 * RevampIT History Configuration
 */
export const HISTORY_CONFIG: HistoryConfig = {
  founding: {
    title: 'Die Gründung von RevampIT',
    subtitle: 'Vom Keller zur Bewegung',
    paragraphs: [
      'RevampIT wurde 2009 in Zürich gegründet – mit einer einfachen, aber radikalen Idee: Computer sollten mindestens 10 Jahre halten, genau wie ein gutes Velo. In einer Zeit, in der immer schnellere Hardware-Zyklen die Norm wurden, setzten wir auf das Gegenteil: Langlebigkeit.',
      'Was als kleine Reparaturwerkstatt begann, entwickelte sich schnell zu einer Anlaufstelle für alle, die ihre Technik länger nutzen wollten. Wir entdeckten, dass Linux und Open-Source-Software der Schlüssel waren, um ältere Hardware wieder flott zu machen.',
      'Heute, über 15 Jahre später, ist RevampIT mehr als nur ein Reparaturservice. Wir sind ein gemeinnütziger Verein mit einem Team von 20 engagierten Menschen, der jährlich über 1000 Geräte vor dem Elektroschrott rettet.',
    ],
  },

  milestones: [
    {
      year: 2009,
      title: 'Gründung',
      description:
        'RevampIT wird als kleine Reparaturwerkstatt in Zürich gegründet. Die Vision: Computer sollten mindestens 10 Jahre halten.',
      type: 'founding',
      highlight: true,
    },
    {
      year: 2011,
      title: 'Erste Linux-Workshops',
      description:
        'Wir starten unsere ersten öffentlichen Linux-Workshops und entdecken die Kraft von Open Source für nachhaltige IT.',
      type: 'community',
    },
    {
      year: 2013,
      title: 'Vereinsgründung',
      description:
        'RevampIT wird offiziell als gemeinnütziger Verein eingetragen und erhält den ZEWO-ähnlichen Status.',
      type: 'achievement',
      highlight: true,
    },
    {
      year: 2015,
      title: 'Soziales Engagement',
      description:
        'Start des Integrationsprogramms für Menschen mit erschwertem Arbeitsmarktzugang. Erste Praktikumsplätze werden geschaffen.',
      type: 'growth',
    },
    {
      year: 2017,
      title: 'Neue Räumlichkeiten',
      description:
        'Umzug in die ehemalige Bank an der Birmensdorferstrasse 379. Mehr Platz für Werkstatt, Laden und Community.',
      type: 'expansion',
      highlight: true,
    },
    {
      year: 2019,
      title: '10 Jahre RevampIT',
      description:
        'Jubiläum! Über 5000 Geräte gerettet, dutzende Menschen in IT-Berufe vermittelt. Die Vision von 2009 ist Realität geworden.',
      type: 'achievement',
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
      title: '15 Jahre nachhaltige IT',
      description:
        'Über 1000 Geräte pro Jahr, 285 Tonnen CO₂ eingespart, 90% Erfolgsquote bei Praktika. RevampIT ist Vorbild für nachhaltige IT in der Schweiz.',
      type: 'achievement',
      highlight: true,
    },
    {
      year: 2025,
      title: 'Vision Community Tech Space',
      description:
        'Planung für einen grösseren Raum mit Museum für Vintage-Hardware, offener Werkstatt und Community-Treffpunkt.',
      type: 'expansion',
    },
  ],

  currentState: {
    teamSize: 20,
    location: 'Birmensdorferstrasse 379, 8055 Zürich',
    yearsActive: new Date().getFullYear() - 2009,
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
