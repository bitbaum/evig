import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/layout/PageHero'
import { AboutSubNav, GeschichteSection, ImpactStatsSection } from '@/components/about'
import { ORG } from '@/config/org'
import { Target, Recycle, Code, Users, Quote, Leaf } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { getTranslations } from 'next-intl/server'

export default async function HardcodedAboutPage() {
  const t = await getTranslations('about')
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
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              {t('mission.badge')}
            </div>
            <Heading level={2} className="text-gray-900 mb-4">
              {t('mission.title')}
            </Heading>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Column */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/Article Pics/storefront.png"
                  alt={`${ORG.name} ${t('mission.imageAlt')}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-green-600 text-white p-4 rounded-xl shadow-lg hidden md:block">
                <p className="text-3xl font-bold">{yearsActive}+</p>
                <p className="text-sm">{t('mission.yearsExperience')}</p>
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              {/* Quote Box */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                <Quote className="h-8 w-8 text-green-500 mb-3" />
                <p className="text-xl md:text-2xl font-medium text-gray-800 italic">
                  &ldquo;{t('mission.quote')}&rdquo;
                </p>
              </div>

              <p className="text-lg text-gray-600 leading-relaxed">
                {t.rich('mission.paragraph1', {
                  strong: (chunks) => <strong className="text-gray-900">{chunks}</strong>,
                })}
              </p>

              <p className="text-lg text-gray-600 leading-relaxed">
                {t('mission.paragraph2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas - Redesigned */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Heading level={2} className="text-gray-900 mb-4">{t('impactAreas.title')}</Heading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('impactAreas.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Hardware Recycling */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                <Recycle className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <Heading level={3} className="text-xl font-bold text-gray-900 mb-3">{t('impactAreas.hardware.title')}</Heading>
              <p className="text-gray-600 leading-relaxed">
                {t('impactAreas.hardware.description')}
              </p>
            </div>

            {/* Card 2 - Open Source */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                <Code className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <Heading level={3} className="text-xl font-bold text-gray-900 mb-3">{t('impactAreas.openSource.title')}</Heading>
              <p className="text-gray-600 leading-relaxed">
                {t('impactAreas.openSource.description')}
              </p>
            </div>

            {/* Card 3 - Community */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <Heading level={3} className="text-xl font-bold text-gray-900 mb-3">{t('impactAreas.community.title')}</Heading>
              <p className="text-gray-600 leading-relaxed">
                {t('impactAreas.community.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section - Data from SSOT */}
      <ImpactStatsSection />

      {/* Our Story - Full Timeline */}
      <GeschichteSection />

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Heading level={2} className="mb-6">{t('cta.title')}</Heading>
          <p className="text-xl mb-8">
            {t('cta.description')}
          </p>
          <Link
            href="/get-involved"
            className="inline-block bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </main>
  )
}
