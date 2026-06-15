import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { AboutSubNav, GeschichteSection, ImpactStatsSection } from '@/components/about'
import { ORG } from '@/config/org'
import { Recycle, Code, Users, Quote, Leaf } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { getTranslations } from 'next-intl/server'

export default async function AboutContent() {
  const t = await getTranslations('about')
  const tEye = await getTranslations('common.eyebrows')
  const yearsActive = new Date().getFullYear() - getDefaultNumeric('founding_year')

  return (
    <main className="min-h-screen">
      <PageHero
        theme="about"
        icon={Leaf}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* Mission Section - Redesigned */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="ui-public-eyebrow">{t('mission.badge').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">
              {t('mission.title')}
            </Heading>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Column */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border">
                <Image
                  src="/images/Article Pics/storefront.webp"
                  alt={`${ORG.name} ${t('mission.imageAlt')}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-action text-action-text p-4 rounded-xl shadow-xs hidden md:block">
                <p className="text-3xl font-bold">{yearsActive}</p>
                <p className="text-sm">{t('mission.yearsExperience')}</p>
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              {/* Quote Box */}
              <div className="bg-surface-raised border-l-4 border-action p-6 rounded-r-xl">
                <Quote className="h-8 w-8 text-action mb-3" />
                <p className="text-xl md:text-2xl font-medium text-text-primary italic">
                  &ldquo;{t('mission.quote')}&rdquo;
                </p>
              </div>

              <p className="text-lg text-text-secondary leading-relaxed">
                {t.rich('mission.paragraph1', {
                  strong: (chunks) => <strong className="text-text-primary">{chunks}</strong>,
                })}
              </p>

              <p className="text-lg text-text-secondary leading-relaxed">
                {t('mission.paragraph2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas - Redesigned */}
      <section className="py-16 md:py-24 bg-canvas">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Heading level={2} className="ui-public-display-lg mb-4">{t('impactAreas.title')}</Heading>
            <p className="ui-public-section-lede mx-auto">
              {t('impactAreas.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1 - Hardware Recycling */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Recycle className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.hardware.title')}</h3>
              <p className="ui-public-card-body">
                {t('impactAreas.hardware.description')}
              </p>
            </article>

            {/* Card 2 - Open Source */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Code className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.openSource.title')}</h3>
              <p className="ui-public-card-body">
                {t('impactAreas.openSource.description')}
              </p>
            </article>

            {/* Card 3 - Community */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.community.title')}</h3>
              <p className="ui-public-card-body">
                {t('impactAreas.community.description')}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* By the Numbers Section - Data from SSOT */}
      <ImpactStatsSection />

      {/* Our Story - Full Timeline */}
      <GeschichteSection />

      {/* Call to Action */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{tEye('ready')}</div>
          <h2 className="ui-public-display-lg mt-4">{t('cta.title')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.description')}</p>
          <div className="mt-10">
            <Link href="/get-involved" className="ui-public-cta-lg">
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
