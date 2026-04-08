/**
 * Media Coverage Section - "Bekannt aus" / "As Seen In"
 *
 * Displays press coverage and media mentions to build credibility.
 * Data sourced from SSOT: src/data/media-coverage.ts
 */

'use client'

import { ExternalLink, Quote, Newspaper, Award, Star } from 'lucide-react'
import {
  MEDIA_COVERAGE,
  getTier1Sources,
  getFeaturedMedia,
  getMediaStats,
  type MediaMention
} from '@/data/media-coverage'

// Tier badge colors
const TIER_STYLES = {
  1: 'bg-amber-100 text-amber-800 border-amber-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-green-100 text-green-800 border-green-200',
  4: 'bg-gray-100 text-gray-800 border-gray-200'
} as const

const TIER_LABELS = {
  1: 'Nationale Medien',
  2: 'Stadt Zürich',
  3: 'Organisationen',
  4: 'Community'
} as const

function MediaCard({ mention }: { mention: MediaMention }) {
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${TIER_STYLES[mention.tier]} mb-2`}>
            {TIER_LABELS[mention.tier]}
          </span>
          <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
            {mention.title}
          </h3>
        </div>
        <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-green-500 flex-shrink-0 transition-colors" />
      </div>

      {/* Source and Date */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Newspaper className="h-4 w-4" />
        <span className="font-medium">{mention.sourceShort}</span>
        <span className="text-gray-300">|</span>
        <span>{mention.date}</span>
      </div>

      {/* Description */}
      {mention.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {mention.description}
        </p>
      )}

      {/* Quote */}
      {mention.quote && (
        <div className="bg-gray-50 rounded-lg p-3 border-l-3 border-green-500">
          <Quote className="h-4 w-4 text-green-500 mb-1" />
          <p className="text-sm text-gray-700 italic">
            &ldquo;{mention.quote}&rdquo;
          </p>
        </div>
      )}

      {/* Read more indicator */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <span className="text-sm text-green-600 font-medium group-hover:underline">
          Artikel lesen &rarr;
        </span>
      </div>
    </a>
  )
}

function FeaturedSourceBadge({ mention }: { mention: MediaMention }) {
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 bg-white rounded-full px-5 py-3 border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
        {mention.sourceShort.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm group-hover:text-green-600 transition-colors truncate">
          {mention.sourceShort}
        </p>
        <p className="text-xs text-gray-500 truncate">{mention.date}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
    </a>
  )
}

export default function MediaCoverageSection() {
  const tier1Sources = getTier1Sources()
  const featuredMedia = getFeaturedMedia()
  const stats = getMediaStats()

  // Get other media (tier 2-4) for the grid
  const otherMedia = MEDIA_COVERAGE.filter(m => m.tier > 1).slice(0, 6)

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Bekannt aus
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Medien über uns
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seit über 20 Jahren setzen wir uns für nachhaltige IT ein.
            Das hat auch die Medien auf uns aufmerksam gemacht.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.totalMentions}+</p>
            <p className="text-sm text-gray-500">Medienbeiträge</p>
          </div>
          <div className="hidden sm:block w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.uniqueSources}</p>
            <p className="text-sm text-gray-500">Verschiedene Quellen</p>
          </div>
          <div className="hidden sm:block w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.partnerships}</p>
            <p className="text-sm text-gray-500">Partnerschaften</p>
          </div>
        </div>

        {/* Featured Sources - Tier 1 Highlight */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-700">Nationale Medien</h3>
            <Star className="h-5 w-5 text-amber-500" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {tier1Sources.map((mention) => (
              <FeaturedSourceBadge key={mention.id} mention={mention} />
            ))}
          </div>
        </div>

        {/* Featured Articles - Full Cards */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">
            Ausgewählte Artikel
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMedia.slice(0, 3).map((mention) => (
              <MediaCard key={mention.id} mention={mention} />
            ))}
          </div>
        </div>

        {/* Other Mentions - Compact Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Weitere Erwähnungen & Partnerschaften
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherMedia.map((mention) => (
              <a
                key={mention.id}
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  mention.tier === 2 ? 'bg-blue-100 text-blue-700' :
                  mention.tier === 3 ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {mention.sourceShort.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm group-hover:text-green-600 transition-colors truncate">
                    {mention.sourceShort}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{mention.title}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Möchtest du über uns berichten?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Presseanfragen
          </a>
        </div>
      </div>
    </section>
  )
}
