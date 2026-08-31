// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Eyebrow } from '@/components/ui/Eyebrow';
import Heading from '@/components/ui/Heading';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/layout/Section';
import { ROUTES } from '@/config/routes';
import { getTranslations } from 'next-intl/server';
import { Factory } from 'lucide-react';

/**
 * Pillar 5 — putting AI and robotics to work inside an organisation.
 *
 * This pillar had no page. `EVIG_PILLARS.adoption` pointed at /contact, which
 * was the honest placeholder while there was nothing to describe: writing a
 * consulting page for work nobody has scoped is exactly the claim the honesty
 * rule exists to prevent.
 *
 * What makes a page defensible NOW is that it describes a way of working
 * rather than a capability inventory. Every section below is about what
 * happens in the room — look at the work, find the tasks worth automating,
 * build one, keep it running. Nothing here promises an outcome, names a
 * client evig does not have, or implies a team size. The boundary block is
 * required and states plainly what this is not, the same shape the division
 * pages use.
 */

interface Props {
  params: Promise<{ locale: string }>;
}

/** Ordered step ids → `services.aiAdoption.steps.<id>.{title,body}`. */
const STEPS = ['look', 'pick', 'build', 'handover'] as const;
/** Ordered boundary ids → `services.aiAdoption.boundary.<id>.{title,body}`. */
const BOUNDARIES = ['noMagic', 'noLockIn', 'noHeadcount'] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.aiAdoption' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AiRoboticsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.aiAdoption' });

  return (
    <main className="min-h-screen">
      <PageHero
        theme="ai"
        icon={Factory}
        size="display"
        title={t('hero.title')}
        subtitle={t('hero.lede')}
      />

      {/* ── Why — the problem an organisation actually has ───────────── */}
      <Section density="spacious" contained={false}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{t('thesis.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-md mt-3">
            {t('thesis.title')}
          </Heading>
          <p className="ui-public-body-lg mt-6">{t('thesis.body')}</p>
        </div>
      </Section>

      {/* ── How it goes, numbered ────────────────────────────────────── */}
      <Section
        density="spacious"
        tone="tinted"
        contained={false}
        className="border-y border-subtle"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{t('steps.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-lg mt-4">
            {t('steps.heading')}
          </Heading>

          <div className="mt-14 space-y-14">
            {STEPS.map((step, index) => (
              <div key={step} className="flex gap-6 sm:gap-8">
                <div className="ui-public-step-num">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <Heading level={3} className="ui-public-card-title">
                    {t(`steps.${step}.title`)}
                  </Heading>
                  <p className="ui-public-prose-muted mt-3">{t(`steps.${step}.body`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Honesty boundary — what this is NOT, before the CTA ──────── */}
      <Section density="spacious" contained={false}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{t('boundary.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-md mt-3">
            {t('boundary.heading')}
          </Heading>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {BOUNDARIES.map((boundary) => (
              <article key={boundary} className="ui-public-card">
                <Heading level={3} className="ui-public-card-title">
                  {t(`boundary.${boundary}.title`)}
                </Heading>
                <p className="ui-public-card-body">{t(`boundary.${boundary}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Section density="spacious" contained={false} className="border-t border-subtle text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Heading level={2} className="ui-public-display-lg">
            {t('cta.heading')}
          </Heading>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.body')}</p>
          <div className="mt-10">
            <Link href={ROUTES.public.contact} className="ui-public-cta-lg">
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
