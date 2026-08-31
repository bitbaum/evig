// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ScrollText,
  AlertTriangle,
  Languages,
  GitCommitHorizontal,
  ExternalLink,
} from 'lucide-react';

import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/layout/Section';
import Heading from '@/components/ui/Heading';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatutenBody } from '@/components/legal/StatutenBody';
import { ORG } from '@/config/org';
import {
  STATUTEN_SECTIONS,
  STATUTEN_STATUS,
  STATUTEN_SOURCE_URL,
  STATUTEN_AUTHORITATIVE_LOCALE,
  getStatutenArticlesBySection,
  getStatutenAnchor,
} from '@/config/statuten';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'statuten' });
  const title = `${t('meta.title')} | ${ORG.name}`;
  const description = t('meta.description', { orgName: ORG.name });

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${ORG.website}/transparenz/statuten`,
      siteName: ORG.name,
    },
  };
}

export default async function StatutenPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'statuten' });

  const isDraft = STATUTEN_STATUS.state === 'draft';
  const isTranslation = locale !== STATUTEN_AUTHORITATIVE_LOCALE;

  return (
    <div className="bg-surface-base">
      <PageHero
        theme="about"
        icon={ScrollText}
        title={t('hero.title')}
        subtitle={t('hero.subtitle', { orgName: ORG.name })}
      />

      <Section density="compact" tone="canvas">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Adoption state. The association is not founded yet — never let the
              document read as though it already governs an existing one. */}
          <Card
            className={
              isDraft ? 'border-warning-500 bg-warning-50 p-5 dark:bg-warning-500/10' : 'p-5'
            }
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={
                  isDraft
                    ? 'mt-0.5 size-5 shrink-0 text-warning-600'
                    : 'mt-0.5 size-5 shrink-0 text-action'
                }
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-text-primary">
                  {isDraft ? t('draft.title') : t('adopted.title')}
                </p>
                <p className="mt-1 leading-7 text-text-secondary">
                  {isDraft
                    ? t('draft.body', { orgName: ORG.name })
                    : t('adopted.body', { adoptedOn: STATUTEN_STATUS.adoptedOn ?? '' })}
                </p>
              </div>
            </div>
          </Card>

          {/* The German wording is the legally binding one; everything else is
              a reading aid. Say so on every translated locale. */}
          {isTranslation && (
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text-primary">{t('authoritative.title')}</p>
                  <p className="mt-1 leading-7 text-text-secondary">{t('authoritative.body')}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Section>

      {/* Table of contents */}
      <Section density="compact" tone="tinted">
        <div className="mx-auto max-w-3xl">
          <Heading level={2} className="mb-6 tracking-tight text-text-primary">
            {t('toc.title')}
          </Heading>
          <ol className="space-y-6">
            {STATUTEN_SECTIONS.map((section) => (
              <li key={section.id}>
                <p className="mb-2 font-mono text-sm uppercase tracking-wider text-text-muted">
                  {section.numeral}. {t(`sections.${section.id}` as never)}
                </p>
                <ul className="space-y-1">
                  {getStatutenArticlesBySection(section.id).map((article) => (
                    <li key={article.id}>
                      <a
                        href={`#${getStatutenAnchor(article)}`}
                        className="text-text-secondary underline-offset-4 hover:text-action hover:underline"
                      >
                        <span className="font-mono text-sm text-text-muted">
                          {t('articleLabel', { num: article.num })}
                        </span>{' '}
                        {t(`articles.${article.id}.title` as never)}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* The statutes themselves */}
      <Section density="default" tone="canvas">
        <div className="mx-auto max-w-3xl space-y-14">
          {STATUTEN_SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`}>
              <Heading
                level={2}
                id={`section-${section.id}`}
                className="mb-8 border-b border-neutral-200 pb-3 tracking-tight text-text-primary"
              >
                <span className="font-mono text-text-muted">{section.numeral}.</span>{' '}
                {t(`sections.${section.id}` as never)}
              </Heading>

              <div className="space-y-10">
                {getStatutenArticlesBySection(section.id).map((article) => (
                  <article
                    key={article.id}
                    id={getStatutenAnchor(article)}
                    className="scroll-mt-24"
                  >
                    <Heading level={3} className="mb-3 tracking-tight text-text-primary">
                      <span className="font-mono text-sm text-text-muted">
                        {t('articleLabel', { num: article.num })}
                      </span>{' '}
                      {t(`articles.${article.id}.title` as never)}
                    </Heading>
                    <StatutenBody
                      body={t(
                        `articles.${article.id}.body` as never,
                        { orgName: ORG.name } as never,
                      )}
                    />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Section>

      {/* Provenance — Art. 14 promises changes stay traceable; this is how. */}
      <Section density="compact" tone="tinted">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <IconBadge icon={GitCommitHorizontal} theme="about" size="md" />
              <div>
                <Heading level={2} className="tracking-tight text-text-primary">
                  {t('source.title')}
                </Heading>
                <p className="mt-2 leading-7 text-text-secondary">
                  {t('source.body', { orgName: ORG.name })}
                </p>
                <a
                  href={STATUTEN_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 font-medium text-action underline-offset-4 hover:underline"
                >
                  {t('source.cta')}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
