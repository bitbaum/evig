/**
 * As Seen In - Compact Logo Strip
 *
 * Displays media logos in grey, colored on hover.
 * Used on homepage for social proof/credibility.
 * Links to full press page for more details.
 */

'use client'

import Link from 'next/link'
import { getTier1Sources } from '@/data/media-coverage'

/**
 * Stylized media logos using text + brand colors
 * Grey by default, colored on hover
 */
const MEDIA_LOGOS = [
  {
    id: 'srf',
    name: 'SRF',
    fullName: 'Schweizer Radio und Fernsehen',
    color: '#C8102E', // SRF red
    url: 'https://www.srf.ch/news/zuerich-schaffhausen-der-computer-recycler'
  },
  {
    id: 'beobachter',
    name: 'Beobachter',
    fullName: 'Beobachter Magazin',
    color: '#E30613', // Beobachter red
    url: 'https://beobachter.ch/umwelt/okologie/recycling-mit-einfallen-gegen-den-abfall'
  },
  {
    id: 'hellozurich',
    name: 'HelloZurich',
    fullName: 'Stadt Zürich',
    color: '#0076BD', // Zürich blue
    url: 'https://www.hellozurich.ch/de/aktuell/revamp-it.html'
  },
  {
    id: 'oebu',
    name: 'öbu',
    fullName: 'Verband für nachhaltiges Wirtschaften',
    color: '#00A651', // öbu green
    url: 'https://www.oebu.ch/news/revamp-it-nachhaltiges-it-upcycling-fuer-oebu-mitglieder'
  },
  {
    id: 'recycling-magazin',
    name: 'RECYCLING magazin',
    fullName: 'Fachmagazin für Recycling',
    color: '#2E7D32', // Green
    url: 'https://www.recyclingmagazin.de/2019/05/06/initiative-fuer-ressourcenschonende-geschaeftsmodelle-in-der-schweiz'
  }
]

export default function AsSeenInLogos() {
  return (
    <section className="py-12 sm:py-16 bg-white border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <p className="text-center text-sm font-medium text-gray-500 mb-8">
          Bekannt aus
        </p>

        {/* Logo Grid */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 lg:gap-x-16 gap-y-6">
          {MEDIA_LOGOS.map((logo) => (
            <a
              key={logo.id}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
              title={logo.fullName}
            >
              {/* Logo text - grey by default, colored on hover */}
              <span
                className="text-xl sm:text-2xl font-bold tracking-tight transition-all duration-300 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                style={{
                  color: logo.color,
                  filter: 'grayscale(100%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(100%)'
                }}
              >
                {logo.name}
              </span>
            </a>
          ))}
        </div>

        {/* Link to full press page */}
        <div className="mt-8 text-center">
          <Link
            href="/about/press"
            className="text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            Alle Medienberichte ansehen →
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * Alternative: Minimal version without link to press page
 * Use when you want just the logo strip
 */
export function AsSeenInLogosMinimal() {
  return (
    <div className="py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">
          Bekannt aus
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {MEDIA_LOGOS.slice(0, 4).map((logo) => (
            <a
              key={logo.id}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
              title={logo.fullName}
            >
              <span
                className="text-lg font-semibold text-gray-400 group-hover:text-gray-900 transition-colors duration-300"
              >
                {logo.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
