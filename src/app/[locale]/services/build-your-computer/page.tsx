'use client'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Card } from '@/components/ui/card'
import { Computer, Award, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
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

      {/* ── Revamped Certification ─────────────────────────────────── */}
      <Section density="spacious" contained={false}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 text-center">
            <Eyebrow as="div" className="inline-flex items-center gap-2 text-action">
              <Award className="w-4 h-4" />
              <span>{t('certification.eyebrow')}</span>
              <Sparkles className="w-4 h-4" />
            </Eyebrow>
            <Heading level={2} className="ui-public-display-md mt-4">{t('certification.heading')}</Heading>
            <p className="ui-public-section-lede mt-6 mx-auto">{t('certification.body')}</p>

            <div className="mt-10">
              <Button as={Link} href="/revamped" variant="primary">
                {t('certification.learnMore')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </Section>

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
