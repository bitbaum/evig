'use client'

import type { BusinessPlan } from '../types'
import { Select } from '@/components/ui/select'

export function BusinessPlanHero({
  hero,
  documentMeta,
}: {
  hero: BusinessPlan['hero']
  documentMeta: BusinessPlan['documentMeta']
}) {
  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <dl className="mb-8 grid gap-x-8 gap-y-2 border-b border-subtle pb-6 font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt>{documentMeta.versionLabel}</dt>
            <dd className="mt-0.5 text-xs text-text-secondary">{documentMeta.asOf}</dd>
          </div>
          <div>
            <dt>{documentMeta.projectLabel}</dt>
            <dd className="mt-0.5 text-xs normal-case tracking-normal text-text-secondary">
              {documentMeta.project}
            </dd>
          </div>
          <div>
            <dt>{documentMeta.sponsorLabel}</dt>
            <dd className="mt-0.5 text-xs normal-case tracking-normal text-text-secondary">
              {documentMeta.sponsor}
            </dd>
          </div>
          <div>
            <dt>{documentMeta.preparedByLabel}</dt>
            <dd className="mt-0.5 text-xs normal-case tracking-normal text-text-secondary">
              {documentMeta.preparedBy}
            </dd>
          </div>
        </dl>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0">
            <div className="ui-public-eyebrow">{hero.eyebrow}</div>
            <h1 className="ui-public-display-lg mt-3">{hero.title}</h1>
            <p className="ui-public-section-lede mt-4 max-w-2xl">{hero.intro}</p>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-subtle bg-canvas">
            <video
              src={hero.heroVideo}
              poster={hero.heroPoster}
              autoPlay
              muted
              loop
              playsInline
              aria-label={hero.heroImageAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </figure>
        </div>
      </div>
    </header>
  )
}

export function BusinessPlanMobileToc({ nav }: { nav: BusinessPlan['nav'] }) {
  return (
    <nav
      aria-label={nav.label}
      className="ui-sticky-subnav lg:hidden border-b border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/75"
    >
      <div className="mx-auto max-w-5xl px-4 py-2.5 sm:px-6">
        <label className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary shrink-0">
            {nav.label}
          </span>
          <Select
            className="flex-1 min-w-0 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                window.location.hash = e.target.value
              }
            }}
          >
            <option value="">— {nav.label} —</option>
            {nav.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </nav>
  )
}
