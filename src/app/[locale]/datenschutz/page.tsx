import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { ORG, CONTACT, LOCATIONS } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface DatenschutzPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: DatenschutzPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'datenschutz' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description', { orgName: ORG.name })
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function DatenschutzPage({ params }: DatenschutzPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'datenschutz' })

  const section2Items = t.raw('section2.items') as string[]
  const section3Items = t.raw('section3.items') as string[]
  const section7Items = t.raw('section7.items') as string[]

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 min-h-screen">
      <Heading level={1} className="mb-8 text-3xl dark:text-white">{t('title')}</Heading>

      <section className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <Heading level={2}>{t('section1.title')}</Heading>
        <p>
          {ORG.legalName}<br />
          {LOCATIONS.store.street}<br />
          {LOCATIONS.store.postalCode} {LOCATIONS.store.city}, {LOCATIONS.store.country}<br />
          {t('section1.emailLabel')} {CONTACT.email}
        </p>

        <Heading level={2}>{t('section2.title')}</Heading>
        <p>{t('section2.intro')}</p>
        <ul>
          {section2Items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>

        <Heading level={2}>{t('section3.title')}</Heading>
        <p>{t('section3.intro')}</p>
        <ul>
          {section3Items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>

        <Heading level={2}>{t('section4.title')}</Heading>
        <p>{t('section4.body')}</p>

        <Heading level={2}>{t('section5.title')}</Heading>
        <p>{t('section5.body')}</p>

        <Heading level={2}>{t('section6.title')}</Heading>
        <p>{t('section6.body')}</p>

        <Heading level={2}>{t('section7.title')}</Heading>
        <p>{t('section7.intro')}</p>
        <ul>
          {section7Items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p>
          {t('section7.downloadText')}{' '}
          <Link href="/dashboard/settings" className="text-primary-700 underline">
            {t('section7.settingsLinkLabel')}
          </Link>
          . {t('section7.contactText')}{' '}
          <a href={`mailto:${CONTACT.email}`} className="text-primary-700 underline">{CONTACT.email}</a>
        </p>

        <Heading level={2}>{t('section8.title')}</Heading>
        <p>{t('section8.body')}</p>

        <Heading level={2}>{t('section9.title')}</Heading>
        <p>{t('section9.body')}</p>

        <Heading level={2}>{t('section10.title')}</Heading>
        <p>
          {t('section10.body')}{' '}
          <Link href="/impressum" className="text-primary-700 underline">{t('section10.impressumLinkLabel')}</Link>.
        </p>

        <p className="mt-12 text-sm text-neutral-500 dark:text-neutral-400">{t('asOf')}</p>
      </section>
    </main>
  )
}
