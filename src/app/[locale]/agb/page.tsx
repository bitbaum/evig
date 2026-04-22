import { Metadata } from 'next'
import Link from 'next/link'
import { ORG, LOCATIONS, CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface AGBPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AGBPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agb' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description'),
  }
}

export default async function AGBPage({ params }: AGBPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agb' })

  const section2Items = t.raw('section2.items') as string[]

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Heading level={1} className="mb-8 text-3xl">{t('title')}</Heading>

      <section className="prose prose-neutral max-w-none space-y-6">
        <Heading level={2}>{t('section1.title')}</Heading>
        <p>{t('section1.body', { legalName: ORG.legalName, address: LOCATIONS.store.fullWithCountry })}</p>

        <Heading level={2}>{t('section2.title')}</Heading>
        <p>{t('section2.intro', { orgName: ORG.name })}</p>
        <ul>
          {section2Items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>

        <Heading level={2}>{t('section3.title')}</Heading>
        <p>{t('section3.body')}</p>

        <Heading level={2}>{t('section4.title')}</Heading>
        <p>{t('section4.body', { orgName: ORG.name })}</p>

        <Heading level={2}>{t('section5.title')}</Heading>
        <p>
          {t('section5.body')}{' '}
          {t('section5.contactLabel')}{' '}
          <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a>.
        </p>

        <Heading level={2}>{t('section6.title')}</Heading>
        <p>{t('section6.body', { orgName: ORG.name })}</p>

        <Heading level={2}>{t('section7.title')}</Heading>
        <p>{t('section7.body', { orgName: ORG.name })}</p>

        <Heading level={2}>{t('section8.title')}</Heading>
        <p>
          {t('section8.body')}{' '}
          <Link href="/datenschutz" className="text-green-700 underline">
            {t('section8.privacyLinkLabel')}
          </Link>
        </p>

        <Heading level={2}>{t('section9.title')}</Heading>
        <p>{t('section9.body')}</p>

        <Heading level={2}>{t('section10.title')}</Heading>
        <p>
          {t('section10.body', { orgName: ORG.name })}{' '}
          <Link href="/impressum" className="text-green-700 underline">
            {t('section10.impressumLinkLabel')}
          </Link>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">{t('asOf')}</p>
      </section>
    </main>
  )
}
