import { Link } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

export async function CTASection() {
  const t = await getTranslations('services.webDesign.cta')

  return (
    <section className="py-20 bg-primary-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <Heading level={2} className="mb-6">{t('title')}</Heading>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
          {t('subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-block bg-white text-primary-800 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-300 text-lg"
          >
            {t('startProject')}
          </Link>
          <Link
            href="/services"
            className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
          >
            {t('allServices')}
          </Link>
        </div>
      </div>
    </section>
  )
}
