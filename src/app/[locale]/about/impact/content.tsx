'use client'

import { useState } from 'react'
import Heading from '@/components/ui/Heading'
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'
import AboutSubNav from '@/components/about/AboutSubNav'
import { Tabs } from '@/components/ui/Tabs'
import { Link } from '@/i18n/navigation'
import { IMPACT_METRICS, getEnvironmentalSummary, getSocialSummary, type ImpactMetric } from '@/data/impact-metrics'
import { getDefaultValue, getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'
import { CheckCircle, ArrowRight, Download, Calendar, MapPin } from 'lucide-react'
import {
  EWasteProblemSection,
  ZeroWasteSolutionSection,
  CommunitySpaceSection
} from '@/components/impact'

interface DonationMethod {
  id: string
  name: string
  description: string
  amount?: string
  benefits: string[]
  ctaText: string
  popular?: boolean
}

export default function ImpactPageContent() {
  const t = useTranslations('about.impact')
  const [selectedDonationMethod, setSelectedDonationMethod] = useState<string | null>(null)
  const envSummary = getEnvironmentalSummary()
  const socialSummary = getSocialSummary()

  const donationMethods: DonationMethod[] = [
    {
      id: 'monthly',
      name: t('donation.methods.monthly.name'),
      description: t('donation.methods.monthly.description'),
      amount: t('donation.methods.monthly.amount'),
      benefits: [
        t('donation.methods.monthly.benefits.0'),
        t('donation.methods.monthly.benefits.1'),
        t('donation.methods.monthly.benefits.2'),
        t('donation.methods.monthly.benefits.3'),
      ],
      ctaText: t('donation.methods.monthly.cta'),
      popular: true
    },
    {
      id: 'one-time',
      name: t('donation.methods.oneTime.name'),
      description: t('donation.methods.oneTime.description'),
      amount: t('donation.methods.oneTime.amount'),
      benefits: [
        t('donation.methods.oneTime.benefits.0'),
        t('donation.methods.oneTime.benefits.1'),
        t('donation.methods.oneTime.benefits.2'),
        t('donation.methods.oneTime.benefits.3'),
      ],
      ctaText: t('donation.methods.oneTime.cta')
    },
    {
      id: 'corporate',
      name: t('donation.methods.corporate.name'),
      description: t('donation.methods.corporate.description'),
      amount: t('donation.methods.corporate.amount'),
      benefits: [
        t('donation.methods.corporate.benefits.0'),
        t('donation.methods.corporate.benefits.1'),
        t('donation.methods.corporate.benefits.2'),
        t('donation.methods.corporate.benefits.3'),
      ],
      ctaText: t('donation.methods.corporate.cta')
    },
    {
      id: 'equipment',
      name: t('donation.methods.equipment.name'),
      description: t('donation.methods.equipment.description'),
      benefits: [
        t('donation.methods.equipment.benefits.0'),
        t('donation.methods.equipment.benefits.1'),
        t('donation.methods.equipment.benefits.2'),
        t('donation.methods.equipment.benefits.3'),
      ],
      ctaText: t('donation.methods.equipment.cta')
    }
  ]

  const CATEGORY_LABEL: Record<ImpactMetric['category'], string> = {
    environmental: 'UMWELT',
    social: 'SOZIAL',
    economic: 'WIRTSCHAFT',
  }

  return (
    <main>
      <ResponsiveHero
        title={t('hero.title')}
        description={t('hero.description')}
      />

      <AboutSubNav />

      <EWasteProblemSection />
      <ZeroWasteSolutionSection />
      <CommunitySpaceSection />

      {/* ── Impact metrics — text-only cards ────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">{t('transparency.title').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('transparency.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('transparency.description')}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {IMPACT_METRICS.map((metric) => (
              <article key={metric.id} className="ui-public-card">
                <div className="ui-public-card-label flex items-center justify-between">
                  <span>{CATEGORY_LABEL[metric.category]}</span>
                  {metric.verified && (
                    <span className="inline-flex items-center gap-1 text-action">
                      <CheckCircle className="h-3 w-3" />
                      <span>{t('verified')}</span>
                    </span>
                  )}
                </div>
                <div className="mt-3 text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  {metric.value}
                </div>
                <h3 className="ui-public-card-title mt-2">{metric.title}</h3>
                <p className="ui-public-card-body">{metric.description}</p>
                <details className="mt-3 text-xs text-text-tertiary">
                  <summary className="cursor-pointer font-mono uppercase tracking-[0.18em]">{t('methodology')}</summary>
                  <p className="mt-2">{metric.methodology}</p>
                  <p className="text-text-tertiary mt-2">{t('lastUpdated')}: {metric.lastUpdated}</p>
                </details>
              </article>
            ))}
          </div>

          {/* Tabbed deep-dive */}
          <div className="mt-16 card-shell p-8">
            <Heading level={3} className="ui-public-display-md text-center mb-8">{t('impactInNumbers')}</Heading>
            <Tabs
              defaultValue="environmental"
              tabs={[
                { value: 'environmental', label: t('tabs.environmental') },
                { value: 'social',        label: t('tabs.social') },
                { value: 'economic',      label: t('tabs.economic') }
              ]}
            >
              {(activeTab) => (
                <>
                  {activeTab === 'environmental' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="ui-public-prose-strong mb-4">{t('environmental.title')}</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('environmental.co2PerDevice', { value: envSummary.co2PerDevice })}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('environmental.ewasteAvoided', { value: envSummary.ewastePreventedTons.toFixed(1) })}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('environmental.reuseRate', { value: Math.round(envSummary.reuseRate * 100) })}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="border-t border-subtle pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                        <h5 className="ui-public-prose-strong mb-4">{t('environmental.comparison')}</h5>
                        <div className="space-y-3 text-sm font-mono tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('environmental.newLaptop')}</span>
                            <span className="text-text-primary">{envSummary.co2ProductionKg} kg CO₂</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('environmental.refurbishment')}</span>
                            <span className="text-text-primary">{envSummary.co2RefurbishmentKg} kg CO₂</span>
                          </div>
                          <div className="flex justify-between border-t border-subtle pt-3">
                            <span className="text-text-secondary">{t('environmental.savings')}</span>
                            <span className="text-action font-semibold">{envSummary.co2PerDevice} kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'social' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="ui-public-prose-strong mb-4">{t('social.title')}</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('social.internshipSuccess', { value: Math.round(socialSummary.internshipSuccessRate * 100) })}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('social.careerReentries', { value: socialSummary.careerReentries })}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('social.peopleHelped', { value: getDefaultValue('people_helped_total') })}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="border-t border-subtle pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                        <h5 className="ui-public-prose-strong mb-4">{t('social.successStories')}</h5>
                        <blockquote className="text-sm text-text-secondary italic">
                          &ldquo;{t('social.testimonial')}&rdquo;
                        </blockquote>
                        <p className="text-xs text-text-tertiary mt-3">— {t('social.testimonialAuthor')}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'economic' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="ui-public-prose-strong mb-4">{t('economic.title')}</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('economic.customerSavings', { value: getDefaultNumeric('customer_savings_chf') })}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('economic.smeOpenSource')}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                            <span>{t('economic.jobs', { value: getDefaultValue('team_size_community') })}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="border-t border-subtle pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                        <h5 className="ui-public-prose-strong mb-4">{t('economic.economicImpact')}</h5>
                        <div className="space-y-3 text-sm font-mono tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('economic.avgRepairCost')}</span>
                            <span className="text-text-primary">CHF {getDefaultNumeric('avg_repair_cost_chf')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">{t('economic.newDevicePrice')}</span>
                            <span className="text-text-primary">CHF {getDefaultNumeric('new_device_comparison_chf')}</span>
                          </div>
                          <div className="flex justify-between border-t border-subtle pt-3">
                            <span className="text-text-secondary">{t('economic.savingsPerCustomer')}</span>
                            <span className="text-action font-semibold">CHF {getDefaultNumeric('customer_savings_chf')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Tabs>
          </div>
        </div>
      </section>

      {/* ── Donation methods — text-only cards ───────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">{t('donation.title').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('donation.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('donation.subtitle')}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {donationMethods.map((method) => {
              const isSelected = selectedDonationMethod === method.id
              return (
                <article
                  key={method.id}
                  className={`ui-public-card cursor-pointer transition-colors ${isSelected ? 'border-strong' : ''}`}
                  onClick={() => setSelectedDonationMethod(method.id)}
                >
                  <div className="ui-public-card-label flex items-center justify-between">
                    <span>{method.name}</span>
                    {method.popular && <span className="text-action">· {t('donation.popular').toUpperCase()}</span>}
                  </div>
                  <p className="ui-public-card-body">{method.description}</p>
                  {method.amount && (
                    <div className="mt-3 font-mono tabular-nums text-lg font-semibold text-text-primary">
                      {method.amount}
                    </div>
                  )}
                  <ul className="space-y-2 mt-4">
                    {method.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle className="h-4 w-4 text-action mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={ROUTES.public.donate}
                    className="ui-public-card-meta mt-4 inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    {method.ctaText}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </article>
              )
            })}
          </div>

          {/* Impact calculator */}
          <div className="mt-12 card-shell p-8">
            <div className="text-center">
              <div className="ui-public-eyebrow">IMPACT</div>
              <h3 className="ui-public-display-md mt-3">{t('donation.impactCalculator')}</h3>
              <p className="ui-public-section-lede mt-4 mx-auto">{t('donation.impactCalculatorDesc')}</p>
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-x-6 gap-y-8 text-center border-t border-subtle pt-10">
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  CHF {getDefaultNumeric('donation_impact_laptop_chf')}
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">{t('donation.laptopRepair')}</p>
              </div>
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  CHF {getDefaultNumeric('donation_impact_internship_chf')}
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">{t('donation.internshipMonth')}</p>
              </div>
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  CHF {getDefaultNumeric('donation_impact_data_recovery_chf')}
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">{t('donation.dataRecovery')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reports — text-only cards ──────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">{t('reports.title').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('reports.title')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('reports.subtitle')}</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <article className="ui-public-card">
              <div className="ui-public-card-label inline-flex items-center gap-2">
                <Download className="h-3 w-3" /> ANNUAL
              </div>
              <h3 className="ui-public-card-title">{t('reports.annual.title')}</h3>
              <p className="ui-public-card-body">{t('reports.annual.description')}</p>
              <span className="ui-public-card-meta">{t('reports.annual.download')} →</span>
            </article>
            <article className="ui-public-card">
              <div className="ui-public-card-label inline-flex items-center gap-2">
                <Calendar className="h-3 w-3" /> IMPACT
              </div>
              <h3 className="ui-public-card-title">{t('reports.impact.title')}</h3>
              <p className="ui-public-card-body">{t('reports.impact.description')}</p>
              <span className="ui-public-card-meta">{t('reports.impact.view')} →</span>
            </article>
            <article className="ui-public-card">
              <div className="ui-public-card-label inline-flex items-center gap-2">
                <MapPin className="h-3 w-3" /> REGISTER
              </div>
              <h3 className="ui-public-card-title">{t('reports.register.title')}</h3>
              <p className="ui-public-card-body">{t('reports.register.description')}</p>
              <span className="ui-public-card-meta">{t('reports.register.open')} →</span>
            </article>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{t('ctaDonate.title').toUpperCase()}</div>
          <h2 className="ui-public-display-lg mt-4">{t('ctaDonate.title')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('ctaDonate.description')}</p>
          <div className="ui-public-cta-row mt-10">
            <Link href={ROUTES.public.donate} className="ui-public-cta">
              {t('ctaDonate.donate')}
            </Link>
            <Link href="/contact" className="ui-public-cta-ghost">
              {t('ctaDonate.contact')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
