/**
 * Origin Story Section — why evig exists.
 *
 * evig is a 2026 spin-off, not a 20-year-old organisation. This section tells
 * the founding story only; it deliberately carries NO achievement timeline and
 * NO "since 2003" track-record stats — evig has no history to claim yet, and we
 * never present another org's record (or invented metrics) as our own. When evig
 * has real, verifiable numbers, add them from the org-numbers SSOT — not before.
 */

'use client'

import { Compass } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'

export default function GeschichteSection() {
  const t = useTranslations('components.geschichteSection')
  const foundingParams = { orgName: ORG.name, foundingYear: ORG.foundingYear }

  return (
    <section className="py-20 bg-surface-raised">
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
            {(['p1', 'p2', 'p3'] as const).map((k) => (
              <p key={k} className="text-text-secondary mb-4 last:mb-0">
                {t(`founding.${k}`, foundingParams)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
