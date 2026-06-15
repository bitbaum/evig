import { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHero } from '@/components/layout/PageHero'
import { Users } from 'lucide-react'

interface InvolvementPageLayoutProps {
  title: string
  description: string
  children: ReactNode
  ctaText: string
  ctaHref: string
}

export async function InvolvementPageLayout({
  title,
  description,
  children,
  ctaText,
  ctaHref
}: InvolvementPageLayoutProps) {
  const t = await getTranslations('getInvolved.cta')
  const tEye = await getTranslations('common.eyebrows')

  return (
    <main className="min-h-screen">
      <PageHero
        theme="getInvolved"
        icon={Users}
        title={title}
        subtitle={description}
      >
        <div className="ui-public-cta-row mt-8">
          <a href={ctaHref} className="ui-public-cta">
            {ctaText}
          </a>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </section>

      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{tEye('ready')}</div>
          <h2 className="ui-public-display-lg mt-4">{t('readyHeading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('readyBody')}</p>
          <div className="ui-public-cta-row mt-10">
            <Link href="/get-involved/kontakt" className="ui-public-cta">
              {t('expressInterestBtn')}
            </Link>
            <Link href="/get-involved" className="ui-public-cta-ghost">
              {t('exploreOptionsBtn')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
