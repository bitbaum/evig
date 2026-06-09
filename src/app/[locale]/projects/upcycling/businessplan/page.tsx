import { getTranslations } from 'next-intl/server'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /projects/upcycling/businessplan — the funder/partner deep-evidence
 * surface for the Monitor-Upcycling project.
 *
 * Eight blocks, each with one focused message:
 *   1. Hero — what this page is for
 *   2. Market context — who we compete with, what the trade-offs are
 *   3. Customer segments — B2B (volume) + B2C (story)
 *   4. Unit economics — what a lamp actually costs
 *   5. Funding mix — three sources, how the ratio shifts
 *   6. Sustainability — when grants drop out
 *   7. Risks — what can go wrong (with mitigations)
 *   8. Partners — who takes which role
 *   9. Research & reports — in-progress studies + downloads
 *
 * Numbers live in messages/<locale>.json paired with their framing
 * prose so a number can't drift from its caveat.
 *
 * Server component — every block is static. No JS interactivity needed.
 * Progressive disclosure handled by the natural reading flow: hero
 * + market sit above the fold; financial detail is further down so a
 * reader scanning for "what's this?" doesn't drown in tables.
 */

type Money = string

type Alternative = {
  label: string
  price: Money
  tradeoff: string
  isOurs?: boolean
}

type RiskItem = { label: string; severity: string; mitigation: string }

type PartnerGroup = { key: string; title: string; names: string[] }

type ResearchItem = { title: string; status: string; description: string }

type BusinessPlanCopy = {
  meta: { title: string; description: string }
  hero: { eyebrow: string; title: string; intro: string }
  marketContext: {
    eyebrow: string
    title: string
    intro: string
    alternatives: Alternative[]
    verdict: string
  }
  segments: {
    eyebrow: string
    title: string
    intro: string
    b2b: { label: string; volume: string; description: string; examples: string[] }
    b2c: { label: string; volume: string; description: string; examples: string[] }
  }
  risks: {
    eyebrow: string
    title: string
    intro: string
    items: RiskItem[]
  }
  partners: {
    eyebrow: string
    title: string
    intro: string
    groups: PartnerGroup[]
  }
  research: {
    title: string
    intro: string
    items: ResearchItem[]
  }
  downloads: { title: string; note: string; cta: string }
}

type EconomicsCopy = {
  eyebrow: string
  title: string
  intro: string
  unitEconomics: {
    title: string
    note: string
    rows: Array<{ label: string; value: string; aside: string; emphasis?: boolean }>
  }
  price: { title: string; body: string }
  funding: {
    title: string
    body: string
    sources: Array<{ label: string; share: string; note: string }>
  }
  sustainability: { title: string; body: string }
  transparency: { note: string; cta: string }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlanCopy
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default async function UpcyclingBusinessPlanPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlanCopy
  const econ = t.raw('upcycling.economics') as EconomicsCopy

  return (
    <article className="bg-canvas">
      <Hero hero={m.hero} />
      <MarketContext section={m.marketContext} />
      <Segments section={m.segments} />
      <UnitCost section={econ.unitEconomics} priceTitle={econ.price.title} priceBody={econ.price.body} />
      <FundingMix section={econ.funding} />
      <Sustainability section={econ.sustainability} />
      <Risks section={m.risks} />
      <Partners section={m.partners} />
      <Research section={m.research} />
      <Downloads section={m.downloads} />
    </article>
  )
}

/* ─── 1. Hero ───────────────────────────────────────────────────── */

function Hero({ hero }: { hero: BusinessPlanCopy['hero'] }) {
  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="ui-public-eyebrow">{hero.eyebrow}</div>
        <h1 className="ui-public-display-lg mt-3">{hero.title}</h1>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{hero.intro}</p>
      </div>
    </header>
  )
}

/* ─── 2. Market context ─────────────────────────────────────────── */
/* Table-of-alternatives is the most useful single artefact a funder
 * can see: who we compete with, what the trade-offs look like, where
 * we land. The verdict line says explicitly what segment we're in. */

function MarketContext({ section }: { section: BusinessPlanCopy['marketContext'] }) {
  return (
    <section className="border-b border-subtle bg-canvas" aria-labelledby="market-title">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="market-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <ul className="mt-10 divide-y divide-subtle border-y border-subtle">
          {section.alternatives.map((alt, i) => (
            <li
              key={i}
              className={cn(
                'grid grid-cols-1 gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6',
                alt.isOurs && 'bg-surface-raised px-4 -mx-4 sm:px-6 sm:-mx-6',
              )}
            >
              <div className="min-w-0">
                <div
                  className={cn(
                    'text-sm font-medium text-text-primary sm:text-base',
                    alt.isOurs && 'text-action',
                  )}
                >
                  {alt.label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                  {alt.tradeoff}
                </p>
              </div>
              <div className="font-mono text-sm tabular-nums text-text-primary sm:text-base sm:text-right">
                {alt.price}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary mr-2">→</span>
          {section.verdict}
        </p>
      </div>
    </section>
  )
}

/* ─── 3. Customer segments ──────────────────────────────────────── */

function Segments({ section }: { section: BusinessPlanCopy['segments'] }) {
  return (
    <section
      className="border-b border-subtle bg-surface-raised"
      aria-labelledby="segments-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="segments-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
          <SegmentCard segment={section.b2b} />
          <SegmentCard segment={section.b2c} />
        </div>
      </div>
    </section>
  )
}

function SegmentCard({
  segment,
}: {
  segment: BusinessPlanCopy['segments']['b2b']
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-subtle bg-surface-base p-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
          {segment.label}
        </span>
        <span className="font-mono text-xs tabular-nums text-text-tertiary">
          {segment.volume}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{segment.description}</p>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary">
        {segment.examples.map((ex, i) => (
          <li key={i} className="font-mono">
            · {ex}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── 4. Unit cost (from upcycling.economics.unitEconomics) ─────── */

function UnitCost({
  section,
  priceTitle,
  priceBody,
}: {
  section: EconomicsCopy['unitEconomics']
  priceTitle: string
  priceBody: string
}) {
  return (
    <section
      id="economics"
      className="border-b border-subtle bg-canvas"
      aria-labelledby="economics-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 space-y-10">
        <div>
          <h2 id="economics-title" className="ui-public-display-md">
            {section.title}
          </h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">
            {section.note}
          </p>

          <dl className="mt-6 divide-y divide-subtle border-y border-subtle">
            {section.rows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 sm:grid-cols-[1fr_auto_auto] sm:gap-x-6',
                  row.emphasis && 'bg-surface-raised px-4 -mx-4 sm:px-6 sm:-mx-6',
                )}
              >
                <dt
                  className={cn(
                    'text-sm leading-snug text-text-primary',
                    row.emphasis && 'font-semibold',
                  )}
                >
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    'font-mono text-sm tabular-nums text-text-primary',
                    row.emphasis && 'text-base font-semibold',
                  )}
                >
                  {row.value}
                </dd>
                <dd className="col-span-2 text-xs leading-snug text-text-tertiary sm:col-span-1 sm:text-right">
                  {row.aside}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary">{priceTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{priceBody}</p>
        </div>
      </div>
    </section>
  )
}

/* ─── 5. Funding mix ────────────────────────────────────────────── */

function FundingMix({ section }: { section: EconomicsCopy['funding'] }) {
  return (
    <section className="border-b border-subtle bg-surface-raised">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.body}</p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {section.sources.map((src, i) => (
            <li
              key={i}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-5"
            >
              <span className="font-mono text-2xl font-light tabular-nums text-text-primary">
                {src.share}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                {src.label}
              </span>
              <span className="text-xs leading-snug text-text-secondary">{src.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ─── 6. Sustainability ─────────────────────────────────────────── */

function Sustainability({ section }: { section: EconomicsCopy['sustainability'] }) {
  return (
    <section className="border-b border-subtle bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
          {section.body}
        </p>
      </div>
    </section>
  )
}

/* ─── 7. Risks ──────────────────────────────────────────────────── */

function Risks({ section }: { section: BusinessPlanCopy['risks'] }) {
  return (
    <section
      className="border-b border-subtle bg-surface-raised"
      aria-labelledby="risks-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="risks-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <ul className="mt-10 divide-y divide-subtle border-y border-subtle">
          {section.items.map((risk, i) => (
            <li key={i} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary sm:text-base">
                  {risk.label}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
                  <span className="font-mono uppercase tracking-[0.14em] text-text-tertiary mr-2">
                    →
                  </span>
                  {risk.mitigation}
                </p>
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-action sm:self-start sm:text-right">
                {risk.severity}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ─── 8. Partners ───────────────────────────────────────────────── */

function Partners({ section }: { section: BusinessPlanCopy['partners'] }) {
  return (
    <section className="border-b border-subtle bg-canvas" aria-labelledby="partners-title">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="partners-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {section.groups.map((group) => (
            <div
              key={group.key}
              className="min-w-0 rounded-xl border border-subtle bg-surface-base p-6"
            >
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                {group.title}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                {group.names.map((name) => (
                  <li key={name} className="flex gap-2">
                    <span aria-hidden="true" className="font-mono text-text-tertiary">·</span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 9. Research ───────────────────────────────────────────────── */

function Research({ section }: { section: BusinessPlanCopy['research'] }) {
  return (
    <section
      className="border-b border-subtle bg-surface-raised"
      aria-labelledby="research-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 id="research-title" className="ui-public-display-md">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <ol className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6"
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
                {item.status}
              </span>
              <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─── 10. Downloads (empty state) ───────────────────────────────── */

function Downloads({ section }: { section: BusinessPlanCopy['downloads'] }) {
  return (
    <section className="bg-canvas" aria-labelledby="downloads-title">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 id="downloads-title" className="ui-public-display-md">
          {section.title}
        </h2>
        <div className="mt-6 rounded-xl border border-dashed border-subtle bg-surface-base p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-text-secondary">{section.note}</p>
          <a
            href={`mailto:${section.cta}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline underline-offset-2"
          >
            {section.cta}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
