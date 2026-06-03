/**
 * Impact Stats Section Component
 *
 * Displays live impact metrics fetched from the DB at render time.
 * Falls back to static estimates if DB is unavailable.
 */

import { Leaf, Users } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import Heading from '@/components/ui/Heading'
import { AVG_DEVICE_WEIGHT_KG } from '@/config/co2-impact'
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { fetchImpactStats } from '@/lib/impact-stats'

export default async function ImpactStatsSection() {
  const [stats, t] = await Promise.all([
    fetchImpactStats(),
    getTranslations('components.impactStatsSection'),
  ])

  const environmentalStats = [
    {
      value: `${stats.totalDevices}+`,
      description: t('devicesSaved'),
      methodologyHref: null as string | null,
    },
    {
      value: `~${stats.co2SavedTons} t`,
      description: t('co2Saved'),
      methodologyHref: '/transparenz/co2',
    },
    {
      value: `${Math.round((stats.totalDevices * AVG_DEVICE_WEIGHT_KG) / 1000 * 10) / 10} t`,
      description: t('ewasteReduced'),
      methodologyHref: null as string | null,
    },
  ]

  const socialStats = [
    {
      value: `${stats.users}+`,
      description: t('members'),
    },
    {
      value: `${stats.repairs}+`,
      description: t('repairsCompleted'),
    },
    {
      value: `${getDefaultNumeric('annual_people_trained')}+`,
      description: t('trainedPeople'),
    },
  ]

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Heading level={2} className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">
          {t('sectionTitle')}
        </Heading>
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Environmental Impact */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <Heading level={3} className="text-xl sm:text-2xl font-bold text-primary-800">
                {t('environmentalTitle')}
              </Heading>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {environmentalStats.map((stat) => (
                <div key={stat.description}>
                  <p className="text-3xl sm:text-4xl font-bold text-primary-700 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-neutral-600">
                    {stat.description}
                    {stat.methodologyHref && (
                      <>
                        {' · '}
                        <Link href={stat.methodologyHref} className="text-primary-700 hover:underline underline-offset-2">
                          Wie berechnet?
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Impact */}
          <div className="bg-primary-50 dark:bg-primary-900/20 p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <Heading level={3} className="text-xl sm:text-2xl font-bold text-primary-800">
                {t('socialTitle')}
              </Heading>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {socialStats.map((stat) => (
                <div key={stat.description}>
                  <p className="text-3xl sm:text-4xl font-bold text-primary-700 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-neutral-600">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/about/impact"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {t('learnMore')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
