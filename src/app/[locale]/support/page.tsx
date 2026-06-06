// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Heart, Coffee, Users, Shield } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'
import { PageShell } from '@/components/layout/PageShell'

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
    <>
      <PageHero
        theme="getInvolved"
        icon={Heart}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <PageShell maxWidth="4xl" py="py-12 sm:py-16">
        {/* Three pillars */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-action-muted rounded-full mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-action" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-text-primary mb-2">
              {t('pillars.noAds.title')}
            </Heading>
            <p className="text-text-secondary">{t('pillars.noAds.description')}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-action-muted rounded-full mb-3 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-action" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-text-primary mb-2">
              {t('pillars.communityDriven.title')}
            </Heading>
            <p className="text-text-secondary">{t('pillars.communityDriven.description')}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-action-muted rounded-full mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-action" />
            </div>
            <Heading level={3} className="text-base sm:text-lg text-text-primary mb-2">
              {t('pillars.qualityFirst.title')}
            </Heading>
            <p className="text-text-secondary">{t('pillars.qualityFirst.description')}</p>
          </div>
        </div>

        {/* Our Promise */}
        <div className="bg-surface-raised rounded-lg p-6 sm:p-8 mb-8 sm:mb-12">
          <Heading level={2} className="text-xl sm:text-2xl text-text-primary mb-3 sm:mb-4">
            {t('promise.title')}
          </Heading>
          <div className="prose prose-lg text-text-secondary">
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
          <div className="border-2 border rounded-lg p-6 sm:p-8 hover:border-action transition-colors">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-action" />
              <Heading level={3} className="text-xl sm:text-2xl text-text-primary">
                {t('oneTime.title')}
              </Heading>
            </div>
            <p className="text-text-secondary mb-6">{t('oneTime.description')}</p>
            <Button as="a" href="https://ko-fi.com/revampit" target="_blank" rel="noopener noreferrer" variant="primary" className="w-full">
              {t('oneTime.cta')}
            </Button>
          </div>

          <div className="border-2 border-action rounded-lg p-6 sm:p-8 bg-action-muted">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-action" />
              <Heading level={3} className="text-xl sm:text-2xl text-text-primary">
                {t('monthly.title')}
              </Heading>
            </div>
            <p className="text-text-secondary mb-6">{t('monthly.description')}</p>
            <Button as="a" href="https://github.com/sponsors/revampit" target="_blank" rel="noopener noreferrer" variant="primary" className="w-full">
              {t('monthly.cta')}
            </Button>
          </div>
        </div>

        {/* Other Ways */}
        <div className="text-center py-8 border-t border">
          <Heading level={3} className="text-xl text-text-primary mb-4">
            {t('otherWays.title')}
          </Heading>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={ROUTES.public.blogSubmit} className="ui-public-cta-ghost">
              {t('otherWays.submitPost')}
            </Link>
            <a
              href="https://github.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-public-cta-ghost"
            >
              {t('otherWays.contributeCode')}
            </a>
            <Link href={ROUTES.public.blog} className="ui-public-cta-ghost">
              {t('otherWays.shareArticle')}
            </Link>
          </div>
        </div>

        {/* Thank You */}
        <div className="text-center py-8">
          <p className="text-lg text-text-secondary">
            <strong>{t('thanks')}</strong>
          </p>
        </div>
      </PageShell>
    </>
  )
}
