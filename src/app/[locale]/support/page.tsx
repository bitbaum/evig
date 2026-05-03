import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Heart, Coffee, Users, Shield } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface SupportPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'support' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'support' })

  const promiseItems = t.raw('promise.items') as string[]

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        theme="getInvolved"
        icon={Heart}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Three pillars */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-neutral-900 mb-2">
              {t('pillars.noAds.title')}
            </Heading>
            <p className="text-neutral-600">{t('pillars.noAds.description')}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-3 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-neutral-900 mb-2">
              {t('pillars.communityDriven.title')}
            </Heading>
            <p className="text-neutral-600">{t('pillars.communityDriven.description')}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-neutral-900 mb-2">
              {t('pillars.qualityFirst.title')}
            </Heading>
            <p className="text-neutral-600">{t('pillars.qualityFirst.description')}</p>
          </div>
        </div>

        {/* Our Promise */}
        <div className="bg-neutral-50 rounded-lg p-6 sm:p-8 mb-8 sm:mb-12">
          <Heading level={2} className="text-xl sm:text-2xl text-neutral-900 mb-3 sm:mb-4">
            {t('promise.title')}
          </Heading>
          <div className="prose prose-lg text-neutral-700">
            <p>{t('promise.intro')}</p>
            <p>{t('promise.enables')}</p>
            <ul className="space-y-2">
              {promiseItems.map((item, i) => (
                <li key={i}>✅ {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="border-2 border-neutral-200 rounded-lg p-6 sm:p-8 hover:border-primary-500 transition-colors">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <Heading level={3} className="text-xl sm:text-2xl text-neutral-900">
                {t('oneTime.title')}
              </Heading>
            </div>
            <p className="text-neutral-600 mb-6">{t('oneTime.description')}</p>
            <a
              href="https://ko-fi.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              {t('oneTime.cta')}
            </a>
          </div>

          <div className="border-2 border-primary-500 rounded-lg p-6 sm:p-8 bg-primary-50">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <Heading level={3} className="text-xl sm:text-2xl text-neutral-900">
                {t('monthly.title')}
              </Heading>
            </div>
            <p className="text-neutral-600 mb-6">{t('monthly.description')}</p>
            <a
              href="https://github.com/sponsors/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              {t('monthly.cta')}
            </a>
          </div>
        </div>

        {/* Other Ways */}
        <div className="text-center py-8 border-t border-neutral-200">
          <Heading level={3} className="text-xl text-neutral-900 mb-4">
            {t('otherWays.title')}
          </Heading>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/blog/submit"
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {t('otherWays.submitPost')}
            </Link>
            <a
              href="https://github.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {t('otherWays.contributeCode')}
            </a>
            <Link
              href="/blog"
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {t('otherWays.shareArticle')}
            </Link>
          </div>
        </div>

        {/* Thank You */}
        <div className="text-center py-8">
          <p className="text-lg text-neutral-600">
            <strong>{t('thanks')}</strong>
          </p>
        </div>
      </div>
    </main>
  )
}
