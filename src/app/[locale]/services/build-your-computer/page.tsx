'use client'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Computer } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { BuildTool } from './BuildTool'
import { Section } from '@/components/layout/Section'

export default function BuildYourComputerPage() {
  const t = useTranslations('services.buildComputer')
  const tEye = useTranslations('common.eyebrows')

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
        <Eyebrow as="div" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span>{t('hero.badge1')}</span>
          <span>·</span>
          <span>{t('hero.badge2')}</span>
          <span>·</span>
          <span>{t('hero.badge3')}</span>
        </Eyebrow>
      </PageHero>

      {/* ── How It Works — text-only numbered steps ─────────────────── */}
      <Section density="spacious" tone="tinted" contained={false} className="border-y border-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Eyebrow as="div">{tEye('howItWorks')}</Eyebrow>
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
      </Section>

      {/* ── Interactive Build Tool — extracted component ───────────── */}
      <BuildTool />

      {/* ── Features — text-only cards ─────────────────────────────── */}
      <Section density="spacious" tone="tinted" contained={false} className="border-y border-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow as="div">{tEye('benefits')}</Eyebrow>
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
      </Section>

      {/* The "REVAMPED-Zertifizierung" block stood here. It sold an exclusive
          label, under the previous organisation's name, for computers "we
          build" — on a page whose own service is `available: false`. It linked
          to /revamped, which is deleted in this commit. If evig ever wants a
          quality label, it should be built on the QC Prüfsiegel the intake
          pipeline already produces, not on a name evig no longer carries. */}

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <Section density="spacious" contained={false} className="border-t border-subtle text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{tEye('ready')}</Eyebrow>
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
      </Section>
    </main>
  )
}
