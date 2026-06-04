/**
 * Media Coverage Section - "Bekannt aus" / "As Seen In"
 *
 * Displays press coverage and media mentions to build credibility.
 * Data sourced from SSOT: src/data/media-coverage.ts
 */

'use client'

import { Link } from '@/i18n/navigation'
import { ExternalLink, Quote, Newspaper, Award, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { buttonClass } from '@/components/ui/button-class'
import {
  MEDIA_COVERAGE,
  getTier1Sources,
  getFeaturedMedia,
  getMediaStats,
  type MediaMention
} from '@/data/media-coverage'

// Tier badge colors
const TIER_STYLES = {
  1: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 border-warning-200 dark:border-warning-800/30',
  2: 'bg-surface-raised text-text-primary border-strong',
  3: 'bg-action-muted-muted text-action border-strong',
  4: 'bg-surface-raised text-text-primary border-strong'
} as const

function MediaCard({ mention, tierLabel, readArticleLabel }: { mention: MediaMention; tierLabel: string; readArticleLabel: string }) {
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block card-shell p-6 hover:border-strong transition-all duration-300 h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${TIER_STYLES[mention.tier]} mb-2`}>
            {tierLabel}
          </span>
          <Heading level={3} className="font-bold text-text-primary group-hover:text-action transition-colors line-clamp-2">
            {mention.title}
          </Heading>
        </div>
        <ExternalLink className="h-4 w-4 text-text-tertiary group-hover:text-action shrink-0 transition-colors" />
      </div>

      {/* Source and Date */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary mb-3">
        <Newspaper className="h-4 w-4" />
        <span className="font-medium">{mention.sourceShort}</span>
        <span className="text-text-muted">|</span>
        <span>{mention.date}</span>
      </div>

      {/* Description */}
      {mention.description && (
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {mention.description}
        </p>
      )}

      {/* Quote */}
      {mention.quote && (
        <div className="bg-surface-raised rounded-lg p-3 border-l-3 border-action">
          <Quote className="h-4 w-4 text-action mb-1" />
          <p className="text-sm text-text-secondary italic">
            &ldquo;{mention.quote}&rdquo;
          </p>
        </div>
      )}

      {/* Read more indicator */}
      <div className="mt-4 pt-3 border-t border-subtle">
        <span className="text-sm text-action font-medium group-hover:underline">
          {readArticleLabel} &rarr;
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
      className="group flex items-center gap-3 bg-surface-base rounded-full px-5 py-3 border border-strong hover:border-action transition-all duration-300"
    >
      <div className="w-8 h-8 bg-action rounded-full flex items-center justify-center text-white text-xs font-bold">
        {mention.sourceShort.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary text-sm group-hover:text-action transition-colors truncate">
          {mention.sourceShort}
        </p>
        <p className="text-xs text-text-tertiary truncate">{mention.date}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-action transition-colors shrink-0" />
    </a>
  )
}

export default function MediaCoverageSection() {
  const t = useTranslations('components.mediaCoverageSection')
  const tier1Sources = getTier1Sources()
  const featuredMedia = getFeaturedMedia()
  const stats = getMediaStats()

  // Get other media (tier 2-4) for the grid
  const otherMedia = MEDIA_COVERAGE.filter(m => m.tier > 1).slice(0, 6)

  const TIER_LABELS: Record<number, string> = {
    1: t('tierNational'),
    2: t('tierCity'),
    3: t('tierOrg'),
    4: t('tierCommunity'),
  }

  return (
    <section className="py-20 bg-surface-raised">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-action-muted-muted text-action px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            {t('awardBadge')}
          </div>
          <Heading level={2} className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            {t('sectionTitle')}
          </Heading>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {t('sectionDesc')}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          <div className="text-center">
            <p className="text-3xl font-bold text-action">{stats.totalMentions}+</p>
            <p className="text-sm text-text-tertiary">{t('statMentions')}</p>
          </div>
          <div className="hidden sm:block w-px bg-surface-overlay" />
          <div className="text-center">
            <p className="text-3xl font-bold text-action">{stats.uniqueSources}</p>
            <p className="text-sm text-text-tertiary">{t('statSources')}</p>
          </div>
          <div className="hidden sm:block w-px bg-surface-overlay" />
          <div className="text-center">
            <p className="text-3xl font-bold text-action">{stats.partnerships}</p>
            <p className="text-sm text-text-tertiary">{t('statPartnerships')}</p>
          </div>
        </div>

        {/* Featured Sources - Tier 1 Highlight */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="h-5 w-5 text-warning-500" />
            <Heading level={3} className="text-lg font-semibold text-text-secondary">{t('tier1Title')}</Heading>
            <Star className="h-5 w-5 text-warning-500" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {tier1Sources.map((mention) => (
              <FeaturedSourceBadge key={mention.id} mention={mention} />
            ))}
          </div>
        </div>

        {/* Featured Articles - Full Cards */}
        <div className="mb-16">
          <Heading level={3} className="text-xl font-semibold text-text-primary mb-8 text-center">
            {t('featuredTitle')}
          </Heading>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMedia.slice(0, 3).map((mention) => (
              <MediaCard key={mention.id} mention={mention} tierLabel={TIER_LABELS[mention.tier]} readArticleLabel={t('readArticle')} />
            ))}
          </div>
        </div>

        {/* Other Mentions - Compact Grid */}
        <div className="card-shell rounded-2xl p-8">
          <Heading level={3} className="text-lg font-semibold text-text-primary mb-6 text-center">
            {t('moreTitle')}
          </Heading>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherMedia.map((mention) => (
              <a
                key={mention.id}
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-lg hover:bg-surface-raised transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  mention.tier === 2 ? 'bg-surface-raised text-text-secondary' :
                  mention.tier === 3 ? 'bg-action-muted-muted text-action' :
                  'bg-surface-raised text-text-secondary'
                }`}>
                  {mention.sourceShort.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm group-hover:text-action transition-colors truncate">
                    {mention.sourceShort}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{mention.title}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-action transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-text-secondary mb-4">
            {t('ctaText')}
          </p>
          <Link href="/contact" className={buttonClass({ variant: 'primary' })}>
            {t('ctaButton')}
          </Link>
        </div>
      </div>
    </section>
  )
}
