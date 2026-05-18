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
  1: 'bg-warning-100 text-warning-800 border-warning-200',
  2: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  3: 'bg-primary-100 text-primary-800 border-primary-200',
  4: 'bg-neutral-100 text-neutral-800 border-neutral-200'
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
      className="group block bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300 h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${TIER_STYLES[mention.tier]} mb-2`}>
            {tierLabels[mention.tier]}
          </span>
          <Heading level={3} className="text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {mention.title}
          </Heading>
        </div>
        <ExternalLink className="h-4 w-4 text-neutral-500 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
      </div>

      {/* Source and Date */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
        <Newspaper className="h-4 w-4" />
        <span className="font-medium">{mention.sourceShort}</span>
        <span className="text-neutral-300">|</span>
        <span>{mention.date}</span>
      </div>

      {/* Description */}
      {mention.description && (
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
          {mention.description}
        </p>
      )}

      {/* Quote */}
      {mention.quote && (
        <div className="bg-neutral-50 rounded-lg p-3 border-l-3 border-primary-500">
          <Quote className="h-4 w-4 text-primary-500 mb-1" />
          <p className="text-sm text-neutral-700 italic">
            &ldquo;{mention.quote}&rdquo;
          </p>
        </div>
      )}

      {/* Read more indicator */}
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <span className="text-sm text-primary-600 font-medium group-hover:underline">
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
      className="group flex items-center gap-3 bg-white rounded-full px-5 py-3 border border-neutral-200 hover:border-primary-400 hover:shadow-md transition-all duration-300"
    >
      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
        {mention.sourceShort.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-neutral-900 text-sm group-hover:text-primary-600 transition-colors truncate">
          {mention.sourceShort}
        </p>
        <p className="text-xs text-neutral-500 truncate">{mention.date}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
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
    <main className="min-h-screen">
      <ResponsiveHero
        title={t('hero.title')}
        description={t('hero.description')}
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* Stats Bar */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{stats.totalMentions}+</p>
              <p className="text-sm text-neutral-500 mt-1">{t('stats.mediaMentions')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{stats.uniqueSources}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('stats.uniqueSources')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary-600">{stats.partnerships}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('stats.partnerships')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* National Media Highlight */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Star className="h-5 w-5 text-warning-500" />
            <Heading level={2} className="text-xl text-neutral-900">{t('nationalMedia')}</Heading>
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
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Heading level={2} className="text-neutral-900 mb-8 text-center">
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
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Heading level={2} className="text-neutral-900 mb-8 text-center">
            {t('otherMentions')}
          </Heading>

          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherMedia.map((mention) => (
                <a
                  key={mention.id}
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-4 rounded-lg bg-white hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    mention.tier === 2 ? 'bg-neutral-100 text-neutral-700' :
                    mention.tier === 3 ? 'bg-primary-100 text-primary-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {mention.sourceShort.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm group-hover:text-primary-600 transition-colors truncate">
                      {mention.sourceShort}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{mention.title}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Contact CTA */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Heading level={2} className="mb-6">{t('pressContact.title')}</Heading>
          <p className="text-xl mb-8 text-primary-100">
            {t('pressContact.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
            >
              {CONTACT.email}
            </a>
            <Link
              href="/contact"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              {t('pressContact.contactForm')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
