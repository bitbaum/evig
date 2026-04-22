import { Metadata } from 'next'
import Link from 'next/link'
import { ORG, CONTACT, LOCATIONS } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface ImpressumPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ImpressumPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'impressum' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description'),
  }
}

export default async function ImpressumPage({ params }: ImpressumPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'impressum' })

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Heading level={1} className="mb-8 text-3xl">{t('title')}</Heading>

      <section className="prose prose-neutral max-w-none space-y-6">
        <Heading level={2}>{t('legalInfo')}</Heading>

        <Heading level={3}>{t('organisation')}</Heading>
        <p>
          {ORG.legalName}<br />
          {LOCATIONS.store.street}<br />
          {LOCATIONS.store.postalCode} {LOCATIONS.store.city}<br />
          {LOCATIONS.store.country}
        </p>

        <Heading level={3}>{t('contact')}</Heading>
        <p>
          {t('emailLabel')} <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a><br />
          {t('phoneLabel')} <a href={CONTACT.phoneTel} className="text-green-700 underline">{CONTACT.phone}</a>
        </p>

        <Heading level={3}>{t('authorised')}</Heading>
        <p>{t('authorisedValue')}</p>

        <Heading level={3}>{t('legalForm')}</Heading>
        <p>{t('legalFormValue')}</p>

        <Heading level={3}>{t('purpose')}</Heading>
        <p>{t('purposeText', { description: ORG.description, orgName: ORG.name })}</p>

        <Heading level={2}>{t('disclaimer')}</Heading>
        <p>{t('disclaimerP1')}</p>
        <p>{t('disclaimerP2')}</p>
        <p>{t('disclaimerP3')}</p>

        <Heading level={2}>{t('linksDisclaimer')}</Heading>
        <p>{t('linksDisclaimerText')}</p>

        <Heading level={2}>{t('copyright')}</Heading>
        <p>{t('copyrightText', { legalName: ORG.legalName })}</p>

        <Heading level={2}>{t('furtherLegal')}</Heading>
        <p>
          {t('furtherLegalText')}{' '}
          <Link href="/datenschutz" className="text-green-700 underline">{t('privacyLinkLabel')}</Link>
          {' '}{t('agbLinkLabel') && (
            <Link href="/agb" className="text-green-700 underline">{t('agbLinkLabel')}</Link>
          )}.
        </p>

        <p className="mt-12 text-sm text-neutral-500">{t('asOf')}</p>
      </section>
    </main>
  )
}
