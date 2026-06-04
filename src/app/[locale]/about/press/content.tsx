/**
 * Press Page Content
 *
 * Full media coverage and press mentions.
 * Follows the pattern of /about/impact
 */

'use client'

import { ExternalLink, Quote, Newspaper, Award, Star, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ORG, CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'
import AboutSubNav from '@/components/about/AboutSubNav'
import { useTranslations } from 'next-intl'
import {
  MEDIA_COVERAGE,
  getTier1Sources,
  getFeaturedMedia,
  getMediaStats,
  type MediaMention
} from '@/data/media-coverage'

// Tier badge colors
const TIER_STYLES = {
  1: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 border-warning-200 dark:border-warning-800/30',
  2: 'bg-surface-raised text-text-primary border',
  3: 'bg-action-muted-muted text-action border-strong',
  4: 'bg-surface-raised text-text-primary border'
} as const

function MediaCard({ mention, readArticleLabel }: { mention: MediaMention; readArticleLabel: string }) {
  const t = useTranslations('about.press')
  const tierLabels = {
    1: t('tierLabels.1'),
    2: t('tierLabels.2'),
    3: t('tierLabels.3'),
    4: t('tierLabels.4'),
  } as const

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
            {tierLabels[mention.tier]}
          </span>
          <Heading level={3} className="text-text-primary group-hover:text-action transition-colors line-clamp-2">
            {mention.title}
          </Heading>
        </div>
        <ExternalLink className="h-4 w-4 text-text-tertiary group-hover:text-action shrink-0 transition-colors" />
      </div>

      {/* Source and Date */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary mb-3">
        <Newspaper className="h-4 w-4" />
        <span className="font-medium">{mention.sourceShort}</span>
        <span className="text-neutral-300">|</span>
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
      className="group flex items-center gap-3 bg-surface-base rounded-full px-5 py-3 border hover:border-action transition-all duration-300"
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
      <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-action transition-colors shrink-0" />
    </a>
  )
}

export default function PressPageContent() {
  const t = useTranslations('about.press')
  const tier1Sources = getTier1Sources()
  const featuredMedia = getFeaturedMedia()
  const stats = getMediaStats()
  const otherMedia = MEDIA_COVERAGE.filter(m => m.tier > 1)

  return (
    <main>
      <ResponsiveHero
        title={t('hero.title')}
        description={t('hero.description')}
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* Stats Bar */}
      <section className="py-12 bg-surface-raised">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-action">{stats.totalMentions}+</p>
              <p className="text-sm text-text-tertiary mt-1">{t('stats.mediaMentions')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-action">{stats.uniqueSources}</p>
              <p className="text-sm text-text-tertiary mt-1">{t('stats.uniqueSources')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-action">{stats.partnerships}</p>
              <p className="text-sm text-text-tertiary mt-1">{t('stats.partnerships')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* National Media Highlight */}
      <section className="py-16 bg-surface-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="h-5 w-5 text-warning-500" />
            <Heading level={2} className="text-xl text-text-primary">{t('nationalMedia')}</Heading>
            <Star className="h-5 w-5 text-warning-500" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {tier1Sources.map((mention) => (
              <FeaturedSourceBadge key={mention.id} mention={mention} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 bg-surface-raised">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Heading level={2} className="text-text-primary mb-8 text-center">
            {t('featuredArticles')}
          </Heading>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMedia.map((mention) => (
              <MediaCard key={mention.id} mention={mention} readArticleLabel={t('readArticle')} />
            ))}
          </div>
        </div>
      </section>

      {/* Other Mentions */}
      <section className="py-16 bg-surface-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Heading level={2} className="text-text-primary mb-8 text-center">
            {t('otherMentions')}
          </Heading>

          <div className="bg-surface-raised rounded-2xl border p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherMedia.map((mention) => (
                <a
                  key={mention.id}
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 rounded-lg bg-surface-base hover:bg-surface-raised transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
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
                  <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-action transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Contact CTA */}
      <section className="py-20 bg-action text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Heading level={2} className="mb-6">{t('pressContact.title')}</Heading>
          <p className="text-xl mb-8 text-action-text">
            {t('pressContact.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-block bg-surface-base text-action px-8 py-4 rounded-lg font-semibold hover:bg-surface-raised transition-colors"
            >
              {CONTACT.email}
            </a>
            <Link
              href="/contact"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-surface-base/10 transition-colors"
            >
              {t('pressContact.contactForm')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
