// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import React from 'react'
import { Metadata } from 'next'
import { ArrowDown } from 'lucide-react'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import { DropoffForm } from '@/components/donate/DropoffForm'
import { CopyButton } from '@/components/community/CopyButton'
import { BANK, LOCATIONS, CONTACT, OPENING_HOURS, ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface DonatePageProps {
  params: Promise<{ locale: string }>
}

// Bypass page cache so payment reference always shows the current month
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

const TIER_AMOUNTS = [50, 100, 500] as const

export default async function DonatePage({ params }: DonatePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'donate' })

  const now = new Date()
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(now)
  const verwendungszweck = t('purposeTemplate', { orgName: ORG.name, month: monthName, year: now.getFullYear() })

  const tierItems = t.raw('tiers.items') as Array<{ title: string; description: string }>

  return (
    <div className="bg-canvas">

      {/* ── Hero — brand promise, no fabricated stats ─────────────── */}
      <section className="ui-public-hero-fold">
        <div className="max-w-5xl">
          <div className="ui-public-hero-badge">{t('hero.positioning')}</div>
          <h1 className="ui-public-hero-title">
            {t('hero.title')}<br />
            <span className="text-text-tertiary">{t('hero.titleSecondary')}</span>
          </h1>
          <p className="ui-public-hero-lede">{t('hero.lede')}</p>
          <p className="ui-public-hero-sublede">{t('hero.sublede')}</p>

          <div className="ui-public-cta-row">
            <a href="#bankueberweisung" className="ui-public-cta inline-flex items-center gap-2">
              {t('hero.ctaMoney')} <ArrowDown className="h-4 w-4" />
            </a>
            <a href="#geraete" className="ui-public-cta-ghost inline-flex items-center gap-2">
              {t('hero.ctaDevice')} <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Two paths ribbon ──────────────────────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-x-16 gap-y-20 md:grid-cols-2">
            <div>
              <div className="ui-public-eyebrow">{t('paths.money.eyebrow')}</div>
              <h3 className="ui-public-display-md mt-3">{t('paths.money.title')}</h3>
              <p className="ui-public-section-lede mt-6">{t('paths.money.body')}</p>
            </div>
            <div>
              <div className="ui-public-eyebrow">{t('paths.device.eyebrow')}</div>
              <h3 className="ui-public-display-md mt-3">{t('paths.device.title')}</h3>
              <p className="ui-public-section-lede mt-6">{t('paths.device.body')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact tiers — text-only cards ────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">{t('tiers.eyebrow')}</div>
            <h2 className="ui-public-display-lg mt-4">{t('tiers.heading')}</h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {tierItems.map((tier, index) => (
              <article key={index} className="ui-public-card">
                <div className="ui-public-card-label font-mono tabular-nums">
                  CHF {TIER_AMOUNTS[index]}
                </div>
                <h3 className="ui-public-card-title">{tier.title}</h3>
                <p className="ui-public-card-body">{tier.description}</p>
                <a href="#bankueberweisung" className="ui-public-card-meta inline-flex items-center gap-1 hover:text-text-primary transition-colors">
                  {t('tiers.cta')} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bank transfer — clean utility block ────────────────────── */}
      <section id="bankueberweisung" className="ui-public-band py-20 sm:py-24 scroll-mt-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('transfer.eyebrow')}</div>
          <h2 className="ui-public-display-md mt-3">{t('transfer.heading')}</h2>
          <p className="ui-public-section-lede mt-4">{t('transfer.intro')}</p>

          <div className="mt-10 rounded-lg border bg-surface-base p-6 sm:p-8 space-y-5">
            {([
              { label: t('transfer.recipientLabel'), value: BANK.accountHolder, mono: false },
              { label: t('transfer.ibanLabel'),      value: BANK.iban,          mono: true },
              { label: t('transfer.bankLabel'),      value: BANK.name,          mono: false, extra: BANK.bic },
              { label: t('transfer.purposeLabel'),   value: verwendungszweck,   mono: false },
            ] as const).map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-1">
                    {row.label}
                  </p>
                  <p className={`text-sm font-semibold text-text-primary break-all ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </p>
                  {row.extra && (
                    <p className="text-xs text-text-tertiary mt-1 font-mono">BIC {row.extra}</p>
                  )}
                </div>
                <CopyButton value={row.value} label={t('transfer.copyBtn')} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Device donation — text-only ───────────────────────────── */}
      <section id="geraete" className="py-20 sm:py-24 scroll-mt-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('devices.eyebrow')}</div>
          <h2 className="ui-public-display-md mt-3">{t('devices.heading')}</h2>
          <p className="ui-public-section-lede mt-4">{t('devices.intro')}</p>

          <div className="ui-public-body-lg mt-10 space-y-8 text-left">
            <div>
              <div className="ui-public-prose-strong">{t('devices.acceptLabel')}</div>
              <p className="ui-public-prose-muted mt-2">{t('devices.acceptText')}</p>
            </div>
            <div>
              <div className="ui-public-prose-strong">{t('devices.notAcceptLabel')}</div>
              <p className="ui-public-prose-muted mt-2">{t('devices.notAcceptText')}</p>
            </div>
            <div>
              <div className="ui-public-prose-strong">{t('devices.prepLabel')}</div>
              <p className="ui-public-prose-muted mt-2">{t('devices.prepText')}</p>
            </div>
          </div>

          <div className="mt-10 rounded-lg border bg-surface-base p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-2">
              {t('devices.addressLabel')}
            </p>
            <p className="text-sm font-semibold text-text-primary">{ORG.name} {LOCATIONS.store.name}</p>
            <p className="text-sm text-text-secondary">{LOCATIONS.store.full}</p>
            <p className="text-xs text-text-tertiary mt-2">{OPENING_HOURS.compact}</p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="ui-public-card-meta mt-4 inline-flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              {t('devices.questionsLink')} →
            </a>
          </div>
        </div>
      </section>

      {/* ── Drop-off form ──────────────────────────────────────────── */}
      <section id="anmeldung" className="ui-public-band py-20 sm:py-24 scroll-mt-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('dropoff.eyebrow')}</div>
          <h2 className="ui-public-display-md mt-3">{t('dropoff.heading')}</h2>
          <p className="ui-public-section-lede mt-4">{t('dropoff.intro')}</p>

          <div className="mt-10 rounded-lg border bg-surface-base p-6 sm:p-8">
            <DropoffForm />
          </div>
        </div>
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 border-t border-subtle">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <NewsletterSignup
            title={t('newsletter.title')}
            description={t('newsletter.description')}
            source="donate-page"
          />
        </div>
      </section>
    </div>
  )
}
