// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Heart, Coffee, Users, Shield } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'

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

  const pillars = [
    { icon: Shield, title: t('pillars.noAds.title'), description: t('pillars.noAds.description') },
    { icon: Users, title: t('pillars.communityDriven.title'), description: t('pillars.communityDriven.description') },
    { icon: Heart, title: t('pillars.qualityFirst.title'), description: t('pillars.qualityFirst.description') },
  ]

  return (
    <>
      <PageHero
        theme="getInvolved"
        icon={Heart}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="ui-public-card text-center">
                <pillar.icon className="w-8 h-8 text-action mx-auto" aria-hidden="true" />
                <h3 className="ui-public-card-title mt-4">{pillar.title}</h3>
                <p className="ui-public-card-body">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-public-band py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('promise.title').toUpperCase()}</div>
          <h2 className="ui-public-display-md mt-4">{t('promise.title')}</h2>
          <div className="ui-public-body-lg mt-6 space-y-4">
            <p>{t('promise.intro')}</p>
            <p>{t('promise.enables')}</p>
            <ul className="space-y-2 text-left">
              {promiseItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-action" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-4">
          <article className="ui-public-card">
            <Coffee className="w-8 h-8 text-action mb-4" aria-hidden="true" />
            <h3 className="ui-public-card-title">{t('oneTime.title')}</h3>
            <p className="ui-public-card-body">{t('oneTime.description')}</p>
            <a
              href="https://ko-fi.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-public-cta mt-6 w-full text-center"
            >
              {t('oneTime.cta')}
            </a>
          </article>

          <article className="ui-public-card border-action/30 bg-action-muted/20">
            <Heart className="w-8 h-8 text-action mb-4" aria-hidden="true" />
            <h3 className="ui-public-card-title">{t('monthly.title')}</h3>
            <p className="ui-public-card-body">{t('monthly.description')}</p>
            <a
              href="https://github.com/sponsors/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="ui-public-cta mt-6 w-full text-center"
            >
              {t('monthly.cta')}
            </a>
          </article>
        </div>
      </section>

      <section className="ui-public-band py-16 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('otherWays.title').toUpperCase()}</div>
          <h2 className="ui-public-display-md mt-4">{t('otherWays.title')}</h2>
          <div className="ui-public-cta-row mt-8">
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
          <p className="ui-public-section-lede mt-10 mx-auto">
            <strong>{t('thanks')}</strong>
          </p>
        </div>
      </section>
    </>
  )
}
