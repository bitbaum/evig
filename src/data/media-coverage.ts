/**
 * Single Source of Truth for Media Coverage
 *
 * All media mentions, articles, and press coverage about RevampIT.
 * Ranked by credibility/prestige for "As Seen In" section.
 *
 * Last updated: 2026-07-21
 */

import { ORG } from '@/config/org'

export interface MediaMention {
  id: string
  source: string
  sourceShort: string // For logo display
  title: string
  url: string
  date: string // YYYY-MM or YYYY
  type: 'article' | 'feature' | 'listing' | 'partnership'
  tier: 1 | 2 | 3 | 4 // 1 = national media, 4 = community/local
  description?: string
  quote?: string
  logoPath?: string // Optional: path to source logo
}

/**
 * All Media Coverage - Ranked by Tier
 *
 * Tier 1: National broadcasters, major publications
 * Tier 2: City/regional official platforms
 * Tier 3: Major organizations, NGOs, industry publications
 * Tier 4: Local community, tech platforms
 */
export const MEDIA_COVERAGE: MediaMention[] = [
  // ============================================
  // TIER 1 - National Media
  // ============================================
  {
    id: 'srf-computer-recycler',
    source: 'SRF (Schweizer Radio und Fernsehen)',
    sourceShort: 'SRF',
    title: 'Der Computer-Recycler',
    url: 'https://www.srf.ch/news/zuerich-schaffhausen-der-computer-recycler',
    date: '2014-09',
    type: 'feature',
    tier: 1,
    description: `Reportage über die Arbeit von ${ORG.name} und wie wir 70 Tonnen Computer vor der Entsorgung gerettet haben.`,
    quote: 'Computer halten locker 10 bis 15 Jahre.'
  },
  {
    id: 'srf-digital',
    source: 'SRF Radio SRF 3',
    sourceShort: 'SRF',
    title: 'Revamp-It: Computer und Zubehör aufgefrischt',
    url: 'https://www.srf.ch/radio-srf-3/digital/revamp-it-computer-und-zubehoer-aufgefrischt',
    date: '2013-03',
    type: 'article',
    tier: 1,
    description: 'Radio-Beitrag über unsere Werkstatt und die moderaten Stundenansätze von 70 Franken.',
    quote: 'In vielen Fällen ist eine Reparatur günstiger als ein Neukauf.'
  },
  {
    id: 'srf-reparieren-sexy',
    source: 'SRF Kultur',
    sourceShort: 'SRF',
    title: 'Reparieren ist sexy und rettet die Welt',
    url: 'https://www.srf.ch/kultur/gesellschaft-religion/reparieren-ist-sexy-und-rettet-die-welt',
    date: '2013-09',
    type: 'article',
    tier: 1,
    description: `Kulturbeitrag über die Reparatur-Bewegung mit Erwähnung von ${ORG.name}.`
  },
  {
    id: 'beobachter',
    source: 'Beobachter',
    sourceShort: 'Beobachter',
    title: 'Mit Einfällen gegen den Abfall',
    url: 'https://beobachter.ch/umwelt/okologie/recycling-mit-einfallen-gegen-den-abfall',
    date: '2015-08',
    type: 'feature',
    tier: 1,
    description: 'Artikel über funktionelles Recycling und wie wir ein Zeichen gegen Hardwareverschwendung setzen.',
    quote: 'Oft ist nur ein Kondensator kaputt – eine einfache Reparatur.'
  },

  // ============================================
  // TIER 2 - City/Regional Platforms
  // ============================================
  {
    id: 'hellozurich',
    source: 'HelloZurich (Stadt Zürich)',
    sourceShort: 'HelloZurich',
    title: 'Das Macbook kostet einen Haarschnitt',
    url: 'https://www.hellozurich.ch/de/aktuell/revamp-it.html',
    date: '2020',
    type: 'feature',
    tier: 2,
    description: 'Feature auf der offiziellen Zürcher Stadtplattform über unser Tauschsystem.',
    quote: 'Rentenalter 10 für Laptops!'
  },
  // Note: Zürich Nachhaltig listing removed - URL no longer accessible

  // ============================================
  // TIER 3 - Major Organizations & Industry
  // ============================================
  {
    id: 'oebu',
    source: 'öbu - Der Verband für nachhaltiges Wirtschaften',
    sourceShort: 'öbu',
    title: 'Revamp-it: Nachhaltiges IT-Upcycling für öbu-Mitglieder',
    url: 'https://www.oebu.ch/news/revamp-it-nachhaltiges-it-upcycling-fuer-oebu-mitglieder',
    date: '2024',
    type: 'partnership',
    tier: 3,
    description: 'Partnerschaft für IT-Upcycling: Aus defekten Monitoren werden Leuchten.'
  },
  {
    id: 'recycling-magazin',
    source: 'RECYCLING magazin',
    sourceShort: 'RECYCLING magazin',
    title: 'Initiative für ressourcenschonende Geschäftsmodelle in der Schweiz',
    url: 'https://www.recyclingmagazin.de/2019/05/06/initiative-fuer-ressourcenschonende-geschaeftsmodelle-in-der-schweiz',
    date: '2019-05',
    type: 'article',
    tier: 3,
    description: 'Erwähnung im Kontext des WWF Katalysator-Programms für nachhaltige Geschäftsmodelle.'
  },
  {
    id: 'kulturlegi',
    source: 'KulturLegi / Caritas Zürich',
    sourceShort: 'KulturLegi',
    title: `${ORG.name} Partner`,
    url: 'https://www.kulturlegi.ch/en/all-of-switzerland/angebot-detail/angebot/revamp-it',
    date: '2024',
    type: 'partnership',
    tier: 3,
    description: 'Partnerschaft mit KulturLegi für vergünstigte IT-Geräte.'
  },

  // ============================================
  // TIER 4 - Community & Tech
  // ============================================
  {
    id: 'wiedikon-maschinen-menschen',
    source: 'Quartierverein Wiedikon',
    sourceShort: 'QV Wiedikon',
    title: 'Von Maschinen und Menschen',
    url: 'https://www.quartierverein-wiedikon.ch/post/von-maschinen-und-menschen',
    date: '2026-05',
    type: 'feature',
    tier: 4,
    description: `Portrait über unsere Kreislauf-Arbeit im Quartier – gebrauchte Computer, GNU/Linux und Arbeitsplätze für Menschen mit schwerem Stand auf dem Arbeitsmarkt.`,
    quote: 'Wir kümmern uns hier nämlich nicht nur um Maschinen, sondern auch um Menschen.'
  },
  {
    id: 'wipkingen',
    source: 'Quartierverein Wipkingen',
    sourceShort: 'QV Wipkingen',
    title: 'Neues Leben am Wipkingerplatz – aus Alt wird Neu',
    url: 'https://wipkingen.net/neues-leben-am-wipkingerplatz-revamp-it-aus-alt-wird-neu/',
    date: '2018',
    type: 'feature',
    tier: 4,
    description: 'Portrait unserer Arbeit im Quartier Wipkingen.'
  },
  {
    id: 'informatiktage',
    source: 'Informatiktage',
    sourceShort: 'Informatiktage',
    title: 'Partner 2025',
    url: 'https://informatiktage.ch/revamp',
    date: '2025',
    type: 'partnership',
    tier: 4,
    description: 'Offizieller Partner der Informatiktage Zürich.'
  }
]

/**
 * Get media coverage by tier
 */
export function getMediaByTier(tier: 1 | 2 | 3 | 4): MediaMention[] {
  return MEDIA_COVERAGE.filter(m => m.tier === tier)
}

/**
 * Get featured media for "As Seen In" section
 * Returns top-tier articles/features only (not listings)
 */
export function getFeaturedMedia(): MediaMention[] {
  return MEDIA_COVERAGE
    .filter(m => m.type === 'article' || m.type === 'feature')
    .filter(m => m.tier <= 2)
    .sort((a, b) => a.tier - b.tier)
}

/**
 * Get all unique sources for logo display
 */
export function getUniqueSourcesForLogos(): { name: string; shortName: string }[] {
  const seen = new Set<string>()
  const sources: { name: string; shortName: string }[] = []

  for (const mention of MEDIA_COVERAGE) {
    if (!seen.has(mention.sourceShort)) {
      seen.add(mention.sourceShort)
      sources.push({
        name: mention.source,
        shortName: mention.sourceShort
      })
    }
  }

  return sources
}

/**
 * Get tier 1 sources (national media) - for prominent display
 */
export function getTier1Sources(): MediaMention[] {
  return MEDIA_COVERAGE.filter(m => m.tier === 1)
}

/**
 * Get count statistics
 */
export function getMediaStats() {
  const articles = MEDIA_COVERAGE.filter(m => m.type === 'article' || m.type === 'feature').length
  const partnerships = MEDIA_COVERAGE.filter(m => m.type === 'partnership').length
  const uniqueSources = new Set(MEDIA_COVERAGE.map(m => m.sourceShort)).size

  return {
    totalMentions: MEDIA_COVERAGE.length,
    articles,
    partnerships,
    uniqueSources
  }
}
