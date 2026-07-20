import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Coins, ArrowRight, Wrench, ExternalLink, HelpCircle, Info } from 'lucide-react'
import { ORG, LOCATIONS } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Card } from '@/components/ui/card'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { Button } from '@/components/ui/button'
import { REPARATURBONUS, KEY_FACTS, STEPS, ELIGIBLE, REVAMPIT_FIT, IMPACT, FAQ_IDS } from './data'

interface PageProps {
  params: Promise<{ locale: string }>
}

/** Swiss grouping (40'000) — independent of the next-intl UI locale ('de'). */
const nf = (n: number) => n.toLocaleString('de-CH')

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'reparaturbonus' })
  return {
    title: t('meta.title'),
    description: t('meta.description', {
      max: REPARATURBONUS.maxBonusChf,
      percent: REPARATURBONUS.coveragePercent,
    }),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description', {
      max: REPARATURBONUS.maxBonusChf,
      percent: REPARATURBONUS.coveragePercent,
    }),
      type: 'article',
    },
  }
}

export default async function ReparaturbonusPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'reparaturbonus' })

  // Programme figures (SSOT: REPARATURBONUS) shared as ICU args across strings.
  // Numbers that must render verbatim (year, decimal budget) are passed as
  // strings so the 'de' number formatter can't turn 2003 into "2.003".
  const figures = {
    max: REPARATURBONUS.maxBonusChf,
    percent: REPARATURBONUS.coveragePercent,
    years: REPARATURBONUS.pilotYears,
    repairs: nf(REPARATURBONUS.expectedRepairs),
    co2: nf(REPARATURBONUS.expectedCo2Tonnes),
    budget: REPARATURBONUS.budgetChfMillions.toString(),
    platform: REPARATURBONUS.platformName,
    city: LOCATIONS.store.city,
    org: ORG.name,
  }

  return (
    <>
      <PageHero
        theme="services"
        icon={Coins}
        size="display"
        title={t('hero.title')}
        subtitle={t('hero.subtitle', figures)}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            href={REPARATURBONUS.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="lg"
            className="gap-2"
          >
            {t('hero.ctaPrimary', figures)}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button href="#so-gehts" variant="outline" size="lg" className="gap-2">
            {t('hero.ctaSecondary')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </PageHero>

      {/* Headline figures */}
      <Section density="default">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KEY_FACTS.map((fact) => (
            <Card key={fact.id} className="h-full p-6">
              <IconBadge icon={fact.icon} theme="services" size="md" />
              <p className="mt-4 text-3xl font-semibold tracking-tight text-text-primary">
                {t(`facts.${fact.id}.value` as never, figures as never)}
              </p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                {t(`facts.${fact.id}.label` as never)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
                {t(`facts.${fact.id}.detail` as never, figures as never)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* How it works — the steps */}
      <Section id="so-gehts" density="default" tone="tinted" className="scroll-mt-24">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('steps.heading')}
          </Heading>
          <p className="mt-3 text-text-secondary">{t('steps.intro', figures)}</p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.id}>
              <Card className="h-full p-6">
                <div className="flex items-center gap-3">
                  <IconBadge icon={step.icon} theme="services" size="md" />
                  <span className="font-mono text-xs tabular-nums text-text-tertiary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                  {t(`steps.${step.id}.title` as never)}
                </Heading>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`steps.${step.id}.body` as never, figures as never)}
                </p>
              </Card>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-sm text-text-tertiary">
          {t('steps.platformNote', figures)}{' '}
          <a
            href={REPARATURBONUS.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-action underline underline-offset-2 hover:no-underline"
          >
            {REPARATURBONUS.platformName}
          </a>
        </p>
      </Section>

      {/* What qualifies */}
      <Section density="default">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('eligible.heading')}
          </Heading>
          <p className="mt-3 text-text-secondary">{t('eligible.intro')}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {ELIGIBLE.map((cat) => (
            <Card key={cat.id} className="h-full p-6">
              <IconBadge icon={cat.icon} theme="services" size="lg" />
              <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                {t(`eligible.${cat.id}.title` as never)}
              </Heading>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`eligible.${cat.id}.body` as never)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* How repairs at Revamp-IT fit */}
      <Section density="default" tone="tinted">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('fit.heading', { org: ORG.name })}
          </Heading>
          <p className="mt-3 text-text-secondary">
            {t('fit.intro', { org: ORG.name, year: String(ORG.foundingYear), city: LOCATIONS.store.city })}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REVAMPIT_FIT.map((item) => (
            <Card key={item.id} className="h-full p-6">
              <IconBadge icon={item.icon} theme="services" size="lg" />
              <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                {t(`fit.${item.id}.title` as never)}
              </Heading>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`fit.${item.id}.body` as never, { org: ORG.name, address: LOCATIONS.store.full } as never)}
              </p>
            </Card>
          ))}
        </div>

        {/* Honest note: we explain the programme, we do not claim registration. */}
        <Card className="mt-6 flex gap-4 border-action/30 bg-action-muted/40 p-5">
          <IconBadge icon={Info} theme="services" size="sm" />
          <p className="text-sm leading-relaxed text-text-secondary">
            {t('fit.note', { platform: REPARATURBONUS.platformName })}
          </p>
        </Card>
      </Section>

      {/* Why it matters */}
      <Section density="default">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('impact.heading')}
          </Heading>
          <p className="mt-3 text-text-secondary">{t('impact.intro', figures)}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {IMPACT.map((item) => (
            <Card key={item.id} className="h-full p-6">
              <IconBadge icon={item.icon} theme="services" size="lg" />
              <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                {t(`impact.${item.id}.title` as never, figures as never)}
              </Heading>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`impact.${item.id}.body` as never, figures as never)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ — native details for progressive disclosure, no client JS */}
      <Section density="default" tone="tinted">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <IconBadge icon={HelpCircle} theme="services" size="md" />
            <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
              {t('faq.heading')}
            </Heading>
          </div>
        </div>

        <div className="mt-8 grid max-w-3xl gap-3">
          {FAQ_IDS.map((id) => (
            <Card key={id} className="p-0">
              <details className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-text-primary">
                  {t(`faq.${id}.q` as never, figures as never)}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-text-tertiary transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {t(`faq.${id}.a` as never, figures as never)}
                </p>
              </details>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section density="compact" tone="inverse">
        <div className="mx-auto max-w-2xl text-center">
          <Heading level={2} className="text-2xl font-semibold sm:text-3xl">
            {t('cta.heading')}
          </Heading>
          <p className="mt-3 text-white/80">{t('cta.body', figures)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              href={REPARATURBONUS.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t('cta.platform', figures)}
            </Button>
            <Button href="/services/computer-repair-upgrades" variant="outline-light" size="lg" className="gap-2">
              <Wrench className="h-4 w-4" aria-hidden="true" />
              {t('cta.repair', { org: ORG.name })}
            </Button>
            <Button href="/contact" variant="outline-light" size="lg" className="gap-2">
              {t('cta.contact')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Section>

      {/* Sources — every figure on this page traces here (credibility SSOT). */}
      <Section density="compact">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
            {t('sources.heading')}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
            <li>
              <a
                href={REPARATURBONUS.cityInfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-action underline underline-offset-2 hover:no-underline"
              >
                {t('sources.city')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href={REPARATURBONUS.platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-action underline underline-offset-2 hover:no-underline"
              >
                {t('sources.platform', { platform: REPARATURBONUS.platformName })}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href={REPARATURBONUS.businessRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-action underline underline-offset-2 hover:no-underline"
              >
                {t('sources.business')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </Section>
    </>
  )
}
