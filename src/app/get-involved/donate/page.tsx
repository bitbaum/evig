import React from 'react'
import { Metadata } from 'next'
import { Leaf, Monitor, Building2, ArrowDown } from 'lucide-react'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import { CopyButton } from '@/components/community/CopyButton'
import { getEnvironmentalSummary } from '@/data/impact-metrics'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Spenden | RevampIT',
  description: 'Direkt helfen. Jede Spende rettet Geräte vor dem Elektroschrott und macht Technologie für alle zugänglich.'
}

// Bypass Next.js page cache so Verwendungszweck always shows the current month
export const revalidate = 0

import { BANK } from '@/config/org'

const BANK_IBAN = BANK.iban
const BANK_BIC = BANK.bic
const BANK_EMPFAENGER = BANK.accountHolder

function getVerwendungszweck() {
  const now = new Date()
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  return `Spende RevampIT ${months[now.getMonth()]} ${now.getFullYear()}`
}

const IMPACT_TIERS: Array<{
  amount: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: 'green' | 'blue' | 'purple'
  highlight?: boolean
}> = [
  {
    amount: 50,
    icon: Leaf,
    title: '1 Gerät gerettet',
    description: '1 Laptop vor dem Elektroschrott gerettet + 285 kg CO₂ vermieden.',
    color: 'green',
  },
  {
    amount: 100,
    icon: Monitor,
    title: '2 Geräte + Workshop-Platz',
    description: '2 Geräte aufbereitet + ein Platz in unserem Linux-Workshop für jemanden, der es sich nicht leisten könnte.',
    color: 'blue',
    highlight: true,
  },
  {
    amount: 500,
    icon: Building2,
    title: 'Firmenspende — 10 Geräte',
    description: '10 Geräte für Bildungseinrichtungen, Sozialprojekte oder einkommensschwache Haushalte.',
    color: 'purple',
  },
]

export default function DonatePage() {
  const env = getEnvironmentalSummary()
  const verwendungszweck = getVerwendungszweck()

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <Heading level={1} className="text-gray-900 mb-4">
            Direkt helfen.
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Jede Spende rettet Geräte vor dem Elektroschrott, verlängert Lebenszyklen
            und ermöglicht Technologie für Menschen, die sich das sonst nicht leisten können.
          </p>
          {/* Primary CTA — anchors to bank transfer box */}
          <a
            href="#bankueberweisung"
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Jetzt überweisen <ArrowDown className="h-4 w-4" />
          </a>
        </div>

        {/* Transparency row — trust signals before the ask */}
        <section className="mb-12 rounded-xl bg-gray-50 border border-gray-200 px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-4">
            Transparenz
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">CHF 60k</p>
              <p className="text-xs text-gray-500 mt-1">Jahresbudget (gemeinnütziger Verein)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{env.devicesSaved}+</p>
              <p className="text-xs text-gray-500 mt-1">Geräte jährlich gerettet</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{env.co2SavedTons} t CO₂</p>
              <p className="text-xs text-gray-500 mt-1">eingespart pro Jahr</p>
            </div>
          </div>
        </section>

        {/* Impact tiers */}
        <section className="mb-4">
          <Heading level={2} className="text-gray-900 mb-6 text-center">Was deine Spende bewirkt</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {IMPACT_TIERS.map((tier) => (
              <div
                key={tier.amount}
                className={`relative rounded-xl border-2 p-6 ${
                  tier.highlight
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Empfohlen
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    tier.color === 'green' ? 'bg-green-100' :
                    tier.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <tier.icon className={`h-5 w-5 ${
                      tier.color === 'green' ? 'text-green-600' :
                      tier.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">CHF {tier.amount}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{tier.title}</p>
                <p className="text-sm text-gray-600">{tier.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bridge CTA — connects tiers to the bank box */}
        <div className="text-center mb-12">
          <a
            href="#bankueberweisung"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-600"
          >
            Betrag wählen und überweisen <ArrowDown className="h-4 w-4" />
          </a>
        </div>

        {/* Bank transfer box — primary CTA */}
        <section id="bankueberweisung" className="mb-12 scroll-mt-8">
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 sm:p-8">
            <Heading level={2} className="text-gray-900 mb-2">Banküberweisung</Heading>
            <p className="text-sm text-gray-500 mb-6">Überweise auf folgendes Konto:</p>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Empfänger</p>
                  <p className="text-sm font-semibold text-gray-900">{BANK_EMPFAENGER}</p>
                </div>
                <CopyButton value={BANK_EMPFAENGER} label="Kopieren" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">IBAN</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{BANK_IBAN}</p>
                </div>
                <CopyButton value={BANK_IBAN} label="IBAN kopieren" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Bank</p>
                  <p className="text-sm text-gray-700">PostFinance AG</p>
                </div>
                <CopyButton value={BANK_BIC} label={`BIC ${BANK_BIC}`} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Verwendungszweck</p>
                  <p className="text-sm text-gray-700">{verwendungszweck}</p>
                </div>
                <CopyButton value={verwendungszweck} label="Kopieren" />
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter signup — secondary CTA */}
        <section className="mb-0 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <NewsletterSignup
            title="Wir informieren dich, wie deine Spende wirkt."
            description="Keine Werbung. Nur echte Updates zu Geräten gerettet, CO₂ eingespart und Menschen unterstützt."
            source="donate-page"
          />
        </section>

      </div>
    </div>
  )
}
