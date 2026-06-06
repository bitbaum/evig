'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Computer, Award, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { getDefaultValue } from '@/lib/org-numbers.defaults'
import { BuildTool } from './BuildTool'

export default function BuildYourComputerPage() {
  const t = useTranslations('services.buildComputer')

  return (
    <main>
      <PageHero
        theme="services"
        icon={Computer}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <p className="ui-public-section-lede mt-4 mx-auto">
          <strong>{t('hero.strong')}</strong>
        </p>
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span>{t('hero.badge1')}</span>
          <span>·</span>
          <span>{t('hero.badge2')}</span>
          <span>·</span>
          <span>{t('hero.badge3')}</span>
        </div>
      </PageHero>

      {/* ── How It Works — text-only numbered steps ─────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="ui-public-eyebrow">SO FUNKTIONIERT ES</div>
          <Heading level={2} className="ui-public-display-lg mt-4">{t('howItWorks.heading')}</Heading>
          <div className="ui-public-body-lg mx-auto mt-14 max-w-3xl space-y-12 text-left">
            {(t.raw('howItWorks.steps') as Array<{ title: string; description: string }>).map((step, index) => (
              <div key={index} className="flex gap-8">
                <div className="ui-public-step-num">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <div className="ui-public-prose-strong">{step.title}</div>
                  <div className="ui-public-prose-muted mt-2">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Build Tool — extracted component ───────────── */}
      <BuildTool />

      {/* ── Features — text-only cards ─────────────────────────────── */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="ui-public-eyebrow">VORTEILE</div>
            <Heading level={2} className="ui-public-display-lg mt-4">{t('features.heading')}</Heading>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(t.raw('features.items') as Array<{ title: string; description: string }>).map((item, index) => (
              <article key={index} className="ui-public-card">
                <div className="ui-public-card-label font-mono tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <Heading level={3} className="ui-public-card-title">{item.title}</Heading>
                <p className="ui-public-card-body">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Revamped Certification ─────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="card-shell p-8 md:p-12 text-center">
            <div className="ui-public-eyebrow inline-flex items-center gap-2 text-action">
              <Award className="w-4 h-4" />
              <span>REVAMPED ZERTIFIZIERT</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <Heading level={2} className="ui-public-display-md mt-4">{t('certification.heading')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('certification.body')}</p>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 border-t border-subtle pt-10">
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  {getDefaultValue('reuse_rate')}
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">
                  {t('certification.sustainabilityScore')}
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  {getDefaultValue('co2_savings_per_device')} kg
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2 flex items-center justify-center gap-1">
                  {t('certification.co2Saved')}
                  <span>·</span>
                  <Link href="/transparenz/co2" className="hover:text-text-primary transition-colors normal-case tracking-normal">
                    Wie berechnet?
                  </Link>
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-text-primary tabular-nums tracking-tight">
                  {getDefaultValue('devices_processed_per_year')}
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mt-2">
                  {t('certification.certifiedComputers')}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Button as={Link} href="/revamped" variant="primary">
                {t('certification.learnMore')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">BEREIT?</div>
          <h2 className="ui-public-display-lg mt-4">{t('cta.heading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.body')}</p>
          <div className="ui-public-cta-row mt-10">
            <Link href="/contact" className="ui-public-cta">
              {t('cta.startBuild')}
            </Link>
            <Link href="/services" className="ui-public-cta-ghost">
              {t('cta.explore')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
