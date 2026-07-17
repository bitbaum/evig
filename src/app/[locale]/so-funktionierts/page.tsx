import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Recycle, ShoppingBag, HandHeart, Code2 } from 'lucide-react'
import { EXTERNAL_LINKS, ORG } from '@/config/org'
import { REVAMPIT_GUARANTEE } from '@/config/marketplace'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Card } from '@/components/ui/card'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { Button } from '@/components/ui/button'
import { JOURNEY_PHASES, OUTCOME_PATHS } from './data'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'soFunktioniert' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: { title: t('meta.title'), description: t('meta.description'), type: 'article' },
  }
}

export default async function SoFunktioniertPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'soFunktioniert' })

  return (
    <>
      <PageHero
        theme="getInvolved"
        icon={Recycle}
        size="display"
        title={t('hero.title')}
        subtitle={t('hero.subtitle', { org: ORG.name })}
      />

      {/* The journey — donation → rehome, in order. */}
      <Section density="default">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('journey.heading')}
          </Heading>
          <p className="mt-3 text-text-secondary">{t('journey.intro')}</p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {JOURNEY_PHASES.map((phase, i) => (
            <li key={phase.id}>
              <Card className="h-full p-6">
                <div className="flex items-center gap-3">
                  <IconBadge icon={phase.icon} theme="getInvolved" size="md" />
                  <span className="font-mono text-xs tabular-nums text-text-tertiary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                  {t(`phases.${phase.id}.title` as never)}
                </Heading>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`phases.${phase.id}.body` as never, { months: REVAMPIT_GUARANTEE.warrantyMonths } as never)}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* The honest part: not every donation is resold. */}
      <Section density="default" tone="tinted">
        <div className="max-w-2xl">
          <Heading level={2} className="text-2xl font-semibold text-text-primary sm:text-3xl">
            {t('paths.heading')}
          </Heading>
          <p className="mt-3 text-text-secondary">{t('paths.intro')}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {OUTCOME_PATHS.map((path) => (
            <Card key={path.id} className="h-full p-6">
              <IconBadge icon={path.icon} theme="getInvolved" size="lg" />
              <Heading level={3} className="mt-4 text-lg font-semibold text-text-primary">
                {t(`paths.${path.id}.title` as never)}
              </Heading>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t(`paths.${path.id}.body` as never)}
              </p>
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
          <p className="mt-3 text-white/80">{t('cta.body')}</p>
          <p className="mt-3 text-sm text-white/70">{t('cta.openNote')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/marketplace" variant="secondary" size="lg" className="gap-2">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {t('cta.buy')}
            </Button>
            <Button href="/get-involved/donate" variant="outline-light" size="lg" className="gap-2">
              <HandHeart className="h-4 w-4" aria-hidden="true" />
              {t('cta.donate')}
            </Button>
            <Button href={EXTERNAL_LINKS.sourceCode} variant="outline-light" size="lg" className="gap-2">
              <Code2 className="h-4 w-4" aria-hidden="true" />
              {t('cta.source')}
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
