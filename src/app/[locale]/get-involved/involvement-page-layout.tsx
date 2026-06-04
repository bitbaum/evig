import { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-class'
import { getTranslations } from 'next-intl/server'
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'
import { responsiveTypography, responsiveSpacing, responsiveButtons } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

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

  return (
    <main className="min-h-screen">
      <ResponsiveHero title={title} description={description}>
        <a
          href={ctaHref}
          className={`${responsiveButtons.primary} bg-surface-base text-action hover:bg-action-muted text-center`}
        >
          {ctaText}
        </a>
      </ResponsiveHero>

      {/* Content Section */}
      <section className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.section} bg-surface-raised`}>
        <div className={`${responsiveSpacing.container} mx-auto text-center`}>
          <Heading level={2} className={`${responsiveTypography.section} ${responsiveSpacing.mbMedium}`}>
            {t('readyHeading')}
          </Heading>
          <p className={`${responsiveTypography.lead} ${responsiveSpacing.mbLarge} max-w-2xl mx-auto text-text-secondary`}>
            {t('readyBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/get-involved/kontakt" className={buttonClass({ variant: 'primary', className: responsiveButtons.large })}>
              {t('expressInterestBtn')}
            </Link>
            <Link
              href="/get-involved"
              className={`${responsiveButtons.large} bg-transparent border-2 border-action text-action hover:bg-action-muted`}
            >
              {t('exploreOptionsBtn')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
