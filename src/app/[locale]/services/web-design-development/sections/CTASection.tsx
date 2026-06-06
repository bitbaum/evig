import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function CTASection() {
  const t = await getTranslations('services.webDesign.cta')

  return (
    <section className="border-t border-subtle py-20 text-center">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="ui-public-eyebrow">BEREIT?</div>
        <h2 className="ui-public-display-lg mt-4">{t('title')}</h2>
        <p className="ui-public-section-lede mt-6 mx-auto">{t('subtitle')}</p>
        <div className="ui-public-cta-row mt-10">
          <Link href="/contact" className="ui-public-cta">
            {t('startProject')}
          </Link>
          <Link href="/services" className="ui-public-cta-ghost">
            {t('allServices')}
          </Link>
        </div>
      </div>
    </section>
  )
}
