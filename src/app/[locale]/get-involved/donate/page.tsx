// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import React from 'react'
import { Metadata } from 'next'
import { Leaf, Monitor, Building2, ArrowDown, Laptop, MonitorSpeaker, Keyboard, HardDrive } from 'lucide-react'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import { CopyButton } from '@/components/community/CopyButton'
import { getEnvironmentalSummary } from '@/data/impact-metrics'
import Heading from '@/components/ui/Heading'
import { BANK, LOCATIONS, CONTACT, OPENING_HOURS, ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface DonatePageProps {
  params: Promise<{ locale: string }>
}

// Bypass Next.js page cache so payment reference always shows the current month
export const revalidate = 0

export async function generateMetadata({ params }: DonatePageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'donate' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

const TIER_ICONS = [Leaf, Monitor, Building2]
const TIER_COLORS = ['green', 'blue', 'purple'] as const
const TIER_AMOUNTS = [50, 100, 500]
const TIER_HIGHLIGHTS = [false, true, false]

const DEVICE_ICONS = [
  { icon: Laptop },
  { icon: MonitorSpeaker },
  { icon: Monitor },
  { icon: Keyboard },
]

export default async function DonatePage({ params }: DonatePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'donate' })
  const env = getEnvironmentalSummary()

  // Build payment reference with locale-aware month name
  const now = new Date()
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(now)
  const verwendungszweck = t('purposeTemplate', { orgName: ORG.name, month: monthName, year: now.getFullYear() })

  const tierItems = t.raw('tiers.items') as Array<{ title: string; description: string }>
  const deviceItems = t.raw('devices.items') as string[]

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <Heading level={1} className="text-neutral-900 mb-4">
            {t('hero.title')}
          </Heading>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
            {t('hero.body')}
          </p>
          <a
            href="#bankueberweisung"
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {t('hero.cta')} <ArrowDown className="h-4 w-4" />
          </a>
        </div>

        {/* Transparency row */}
        <section className="mb-12 rounded-xl bg-neutral-50 border border-neutral-200 px-6 py-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide text-center mb-4">
            {t('transparency.label')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{t('transparency.budgetValue')}</p>
              <p className="text-xs text-neutral-500 mt-1">{t('transparency.budgetLabel')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{env.devicesSaved}+</p>
              <p className="text-xs text-neutral-500 mt-1">{t('transparency.devicesLabel')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{env.co2SavedTons} t CO₂</p>
              <p className="text-xs text-neutral-500 mt-1">{t('transparency.co2Label')}</p>
            </div>
          </div>
        </section>

        {/* Impact tiers */}
        <section className="mb-4">
          <Heading level={2} className="text-neutral-900 mb-6 text-center">{t('tiers.heading')}</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tierItems.map((tier, index) => {
              const Icon = TIER_ICONS[index]
              const color = TIER_COLORS[index]
              const highlight = TIER_HIGHLIGHTS[index]
              return (
                <div
                  key={index}
                  className={`relative rounded-xl border-2 p-6 ${
                    highlight ? 'border-info-400 bg-info-50' : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-info-600 px-3 py-0.5 text-xs font-semibold text-white">
                      {t('tiers.recommended')}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      color === 'green' ? 'bg-primary-100' :
                      color === 'blue' ? 'bg-info-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        color === 'green' ? 'text-primary-600' :
                        color === 'blue' ? 'text-info-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">CHF {TIER_AMOUNTS[index]}</span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">{tier.title}</p>
                  <p className="text-sm text-neutral-600">{tier.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Bridge CTA */}
        <div className="text-center mb-12">
          <a
            href="#bankueberweisung"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-600"
          >
            {t('bridgeCta')} <ArrowDown className="h-4 w-4" />
          </a>
        </div>

        {/* Bank transfer box */}
        <section id="bankueberweisung" className="mb-12 scroll-mt-8">
          <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-6 sm:p-8">
            <Heading level={2} className="text-neutral-900 mb-2">{t('transfer.heading')}</Heading>
            <p className="text-sm text-neutral-500 mb-6">{t('transfer.intro')}</p>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">{t('transfer.recipientLabel')}</p>
                  <p className="text-sm font-semibold text-neutral-900">{BANK.accountHolder}</p>
                </div>
                <CopyButton value={BANK.accountHolder} label={t('transfer.copyBtn')} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">{t('transfer.ibanLabel')}</p>
                  <p className="text-sm font-mono font-semibold text-neutral-900">{BANK.iban}</p>
                </div>
                <CopyButton value={BANK.iban} label={t('transfer.copyIbanBtn')} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">{t('transfer.bankLabel')}</p>
                  <p className="text-sm text-neutral-700">{BANK.name}</p>
                </div>
                <CopyButton value={BANK.bic} label={`BIC ${BANK.bic}`} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">{t('transfer.purposeLabel')}</p>
                  <p className="text-sm text-neutral-700">{verwendungszweck}</p>
                </div>
                <CopyButton value={verwendungszweck} label={t('transfer.copyBtn')} />
              </div>
            </div>
          </div>
        </section>

        {/* Device donation */}
        <section id="geraete" className="mb-12 scroll-mt-8">
          <Heading level={2} className="text-neutral-900 mb-2">{t('devices.heading')}</Heading>
          <p className="text-sm text-neutral-500 mb-6">{t('devices.intro')}</p>
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {DEVICE_ICONS.map(({ icon: Icon }, index) => (
                <div key={index} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-neutral-700">{deviceItems[index]}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm text-neutral-700 mb-6">
              <p><span className="font-semibold">{t('devices.acceptLabel')}</span> {t('devices.acceptText')}</p>
              <p><span className="font-semibold">{t('devices.notAcceptLabel')}</span> {t('devices.notAcceptText')}</p>
              <p><span className="font-semibold">{t('devices.prepLabel')}</span> {t('devices.prepText')}</p>
            </div>
            <div className="rounded-lg bg-white border border-orange-200 p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">{t('devices.addressLabel')}</p>
              <p className="text-sm font-semibold text-neutral-900">{ORG.name} {LOCATIONS.store.name}</p>
              <p className="text-sm text-neutral-600">{LOCATIONS.store.full}</p>
              <p className="text-xs text-neutral-500 mt-2">{OPENING_HOURS.compact}</p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-600"
              >
                {t('devices.questionsLink')}
              </a>
            </div>
          </div>
        </section>

        {/* Newsletter signup */}
        <section className="mb-0 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <NewsletterSignup
            title={t('newsletter.title')}
            description={t('newsletter.description')}
            source="donate-page"
          />
        </section>

      </div>
    </div>
  )
}
