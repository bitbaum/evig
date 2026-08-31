/**
 * Origin Story Section — why evig exists.
 *
 * evig is a 2026 spin-off, not a 20-year-old organisation. This section names
 * and honours the org evig grew out of — Revamp-IT, the Zürich circular-IT
 * non-profit (link + facts from {@link ORG_ORIGIN}). Their "since 2003" history
 * is theirs, told as theirs; evig claims no track record it hasn't earned and
 * carries NO achievement timeline or invented metrics of its own. When evig has
 * real, verifiable numbers, add them from the org-numbers SSOT — not before.
 */

'use client';

import { Compass } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { ORG, ORG_ORIGIN } from '@/config/org';
import { Section } from '@/components/layout/Section';

export default function GeschichteSection() {
  const t = useTranslations('components.geschichteSection');
  const foundingParams = { orgName: ORG.name, foundingYear: ORG.foundingYear };

  return (
    <Section density="spacious" tone="tinted" contained={false}>
      <div className="max-w-3xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-action-muted/15 text-action px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Compass className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {t('founding.title', foundingParams)}
          </Heading>
          <p className="text-xl text-text-secondary">{t('founding.subtitle')}</p>
        </div>

        {/* Founding Story */}
        <div className="card-shell rounded-2xl p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-text-secondary mb-4">
              {t.rich('founding.p1', {
                ...foundingParams,
                a: (chunks) => (
                  <a
                    href={ORG_ORIGIN.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-action underline underline-offset-2"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
            <p className="text-text-secondary mb-4">{t('founding.p2', foundingParams)}</p>
            <p className="text-text-secondary mb-4 last:mb-0">{t('founding.p3', foundingParams)}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
