import { getTranslations } from 'next-intl/server'
import { ExternalLink, ArrowRight, Check, X, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /projects/upcycling/businessplan — the funder/partner deep-evidence
 * surface for the Monitor-Upcycling project.
 *
 * Layout philosophy (2026-06 restructure):
 *   - Sticky table of contents at the top lets readers jump to any
 *     section. The page is long by design; navigation must be flawless.
 *   - Every claim links to a source. Trust beats prose.
 *   - Information hierarchy: hero → market research (evidence) →
 *     alternatives → customers → suppliers → economics → risk → research
 *     → open questions → get involved. The reader can stop at any level
 *     and still have something coherent.
 *   - Server-rendered; all interactivity is native (sticky CSS + anchor
 *     navigation). No client component needed.
 *
 * Numbers live in messages/<locale>.json paired with their framing prose
 * and source URLs so a number can't drift from its caveat or citation.
 */

type Money = string

type Alternative = {
  label: string
  price: Money
  tradeoff: string
  isOurs?: boolean
  sourceUrl?: string
}

type RiskItem = { label: string; severity: string; mitigation: string }

type PartnerGroup = { key: string; title: string; names: string[] }

type ResearchItem = { title: string; status: string; description: string }

type DataPoint = {
  label: string
  value: string
  note: string
  sourceLabel: string
  sourceUrl: string
}

type SupplierSource = {
  key: string
  label: string
  description: string
  volume: string
  linkLabel: string
  linkUrl: string
}

type OpenQuestion = { q: string; title: string; body: string; tag: string }

type GetInvolvedOption = {
  key: string
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  linkLabel?: string
  linkUrl?: string
}

type NavItem = { id: string; label: string }

type BusinessPlanCopy = {
  meta: { title: string; description: string }
  nav: { label: string; items: NavItem[] }
  hero: { eyebrow: string; title: string; intro: string }
  marketResearch: {
    eyebrow: string
    title: string
    intro: string
    datapoints: DataPoint[]
    methodologyNote: string
    methodologyLinks: { label: string; url: string }[]
  }
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
  suppliers: {
    eyebrow: string
    title: string
    intro: string
    sources: SupplierSource[]
    criteria: { title: string; items: string[] }
    rejected: { title: string; items: string[] }
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
  openQuestions: {
    eyebrow: string
    title: string
    intro: string
    items: OpenQuestion[]
    feedbackCta: string
    feedbackEmail: string
  }
  getInvolved: {
    eyebrow: string
    title: string
    intro: string
    options: GetInvolvedOption[]
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
      <TableOfContents nav={m.nav} />
      <MarketResearch section={m.marketResearch} />
      <MarketContext section={m.marketContext} />
      <Segments section={m.segments} />
      <Suppliers section={m.suppliers} />
      <UnitCost section={econ.unitEconomics} priceTitle={econ.price.title} priceBody={econ.price.body} />
      <FundingMix section={econ.funding} />
      <Sustainability section={econ.sustainability} />
      <Risks section={m.risks} />
      <Partners section={m.partners} />
      <Research section={m.research} />
      <OpenQuestions section={m.openQuestions} />
      <GetInvolved section={m.getInvolved} />
      <Downloads section={m.downloads} />
    </article>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────── */

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

/* ─── Table of Contents (sticky sub-nav) ─────────────────────────
 * Anchor links to every major section, sticky under the main header.
 * On mobile, the list scrolls horizontally — never wraps, never hides.
 * CSS scroll-behavior:smooth + scroll-margin-top:5rem on each section
 * lands the anchor target below the sticky bar instead of behind it.
 */
function TableOfContents({ nav }: { nav: BusinessPlanCopy['nav'] }) {
  return (
    <nav
      aria-label={nav.label}
      className="ui-sticky-subnav border-b border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/75"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mr-3 shrink-0">
            {nav.label}
          </span>
          {nav.items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

/* ─── Section wrapper — applies anchor scroll-margin uniformly ──── */

function Section({
  id,
  tone = 'canvas',
  children,
  labelledBy,
  ariaLabel,
}: {
  id: string
  tone?: 'canvas' | 'raised' | 'base'
  children: React.ReactNode
  labelledBy?: string
  ariaLabel?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'border-b border-subtle scroll-mt-20 sm:scroll-mt-24',
        tone === 'canvas' && 'bg-canvas',
        tone === 'raised' && 'bg-surface-raised',
        tone === 'base'   && 'bg-surface-base',
      )}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {children}
      </div>
    </section>
  )
}

/* ─── Market research (NEW) ─────────────────────────────────────── */

function MarketResearch({ section }: { section: BusinessPlanCopy['marketResearch'] }) {
  return (
    <Section id="marktforschung" tone="base" labelledBy="research-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="research-title" className="ui-public-display-md mt-3">
        {section.title}
      </h2>
      <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

      <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
        {section.datapoints.map((dp, i) => (
          <article
            key={i}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-canvas p-5"
          >
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">
              {dp.label}
            </span>
            <span className="font-mono text-2xl font-light tabular-nums text-text-primary">
              {dp.value}
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">{dp.note}</p>
            <a
              href={dp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline underline-offset-2"
            >
              {dp.sourceLabel}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>

      <details className="mt-8 group rounded-xl border border-subtle bg-canvas open:bg-surface-raised">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-text-secondary flex items-center justify-between gap-3 hover:text-text-primary">
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
              METHODIK
            </span>
            <span>{section.methodologyNote.split('.')[0]}.</span>
          </span>
          <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">
            ⌄
          </span>
        </summary>
        <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-text-secondary">
          <p>{section.methodologyNote}</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {section.methodologyLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline underline-offset-2"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </Section>
  )
}

/* ─── Market context (alternatives) ─────────────────────────────── */

function MarketContext({ section }: { section: BusinessPlanCopy['marketContext'] }) {
  return (
    <Section id="alternatives" tone="canvas" labelledBy="alternatives-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="alternatives-title" className="ui-public-display-md mt-3">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-medium text-text-primary sm:text-base',
                    alt.isOurs && 'text-action',
                  )}
                >
                  {alt.label}
                </span>
                {alt.sourceUrl && (
                  <a
                    href={alt.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-text-tertiary hover:text-action"
                    aria-label={`${alt.label} — Quelle`}
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
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
    </Section>
  )
}

/* ─── Customer segments ─────────────────────────────────────────── */

function Segments({ section }: { section: BusinessPlanCopy['segments'] }) {
  return (
    <Section id="segments" tone="raised" labelledBy="segments-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="segments-title" className="ui-public-display-md mt-3">
        {section.title}
      </h2>
      <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

      <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
        <SegmentCard segment={section.b2b} />
        <SegmentCard segment={section.b2c} />
      </div>
    </Section>
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

/* ─── Suppliers (NEW) ───────────────────────────────────────────── */

function Suppliers({ section }: { section: BusinessPlanCopy['suppliers'] }) {
  return (
    <Section id="lieferanten" tone="canvas" labelledBy="suppliers-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="suppliers-title" className="ui-public-display-md mt-3">
        {section.title}
      </h2>
      <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

      <ul className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
        {section.sources.map((src) => (
          <li
            key={src.key}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6"
          >
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-action">
              {src.label}
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">{src.description}</p>
            <span className="font-mono text-xs tabular-nums text-text-tertiary">
              {src.volume}
            </span>
            <a
              href={src.linkUrl}
              {...(src.linkUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline underline-offset-2"
            >
              {src.linkLabel}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
        <CriteriaCard
          variant="accept"
          title={section.criteria.title}
          items={section.criteria.items}
        />
        <CriteriaCard
          variant="reject"
          title={section.rejected.title}
          items={section.rejected.items}
        />
      </div>
    </Section>
  )
}

function CriteriaCard({
  variant,
  title,
  items,
}: {
  variant: 'accept' | 'reject'
  title: string
  items: string[]
}) {
  const Icon = variant === 'accept' ? Check : X
  return (
    <div className="min-w-0 rounded-xl border border-subtle bg-surface-base p-6">
      <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-action">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                variant === 'accept' ? 'text-action' : 'text-text-tertiary',
              )}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Unit economics ─────────────────────────────────────────────── */

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
    <Section id="economics" tone="base" labelledBy="economics-title">
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

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-text-primary">{priceTitle}</h3>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{priceBody}</p>
      </div>
    </Section>
  )
}

/* ─── Funding mix ───────────────────────────────────────────────── */

function FundingMix({ section }: { section: EconomicsCopy['funding'] }) {
  return (
    <Section id="funding" tone="raised" labelledBy="funding-title">
      <h2 id="funding-title" className="ui-public-display-md">{section.title}</h2>
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
    </Section>
  )
}

/* ─── Sustainability ────────────────────────────────────────────── */

function Sustainability({ section }: { section: EconomicsCopy['sustainability'] }) {
  return (
    <Section id="sustainability" tone="canvas">
      <div className="mx-auto max-w-3xl">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
          {section.body}
        </p>
      </div>
    </Section>
  )
}

/* ─── Risks ─────────────────────────────────────────────────────── */

function Risks({ section }: { section: BusinessPlanCopy['risks'] }) {
  return (
    <Section id="risks" tone="raised" labelledBy="risks-title">
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
    </Section>
  )
}

/* ─── Partners ──────────────────────────────────────────────────── */

function Partners({ section }: { section: BusinessPlanCopy['partners'] }) {
  return (
    <Section id="partners" tone="canvas" labelledBy="partners-title">
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
    </Section>
  )
}

/* ─── Research ──────────────────────────────────────────────────── */

function Research({ section }: { section: BusinessPlanCopy['research'] }) {
  return (
    <Section id="research" tone="raised" labelledBy="active-research-title">
      <h2 id="active-research-title" className="ui-public-display-md">
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
    </Section>
  )
}

/* ─── Open questions (NEW) ──────────────────────────────────────── */

function OpenQuestions({ section }: { section: BusinessPlanCopy['openQuestions'] }) {
  return (
    <Section id="openQuestions" tone="canvas" labelledBy="open-questions-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="open-questions-title" className="ui-public-display-md mt-3">
        {section.title}
      </h2>
      <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

      <ul className="mt-10 space-y-2">
        {section.items.map((q) => (
          <li key={q.q}>
            <details className="group rounded-xl border border-subtle bg-surface-base open:bg-surface-raised">
              <summary className="cursor-pointer list-none px-5 py-4 flex items-start gap-4 hover:bg-surface-raised/50">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-action shrink-0 mt-0.5">
                  {q.q}
                </span>
                <span className="flex-1 text-sm font-medium text-text-primary sm:text-base">
                  {q.title}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary shrink-0 mt-1">
                  {q.tag}
                </span>
                <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180 mt-0.5">
                  ⌄
                </span>
              </summary>
              <p className="px-5 pb-5 pt-1 pl-[3.5rem] text-sm leading-relaxed text-text-secondary">
                {q.body}
              </p>
            </details>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-xl border border-dashed border-subtle bg-surface-base p-6 text-center">
        <p className="text-sm text-text-secondary">{section.feedbackCta}</p>
        <a
          href={`mailto:${section.feedbackEmail}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline underline-offset-2"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {section.feedbackEmail}
        </a>
      </div>
    </Section>
  )
}

/* ─── Get involved (NEW) ────────────────────────────────────────── */

function GetInvolved({ section }: { section: BusinessPlanCopy['getInvolved'] }) {
  return (
    <Section id="getInvolved" tone="raised" labelledBy="get-involved-title">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 id="get-involved-title" className="ui-public-display-md mt-3">
        {section.title}
      </h2>
      <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

      <ul className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2">
        {section.options.map((opt) => (
          <li
            key={opt.key}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6"
          >
            <h3 className="text-base font-semibold text-text-primary">{opt.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{opt.body}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={opt.ctaHref}
                {...(opt.ctaHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline underline-offset-2"
              >
                {opt.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              {opt.linkUrl && (
                <a
                  href={opt.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-action"
                >
                  {opt.linkLabel}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── Downloads (empty state) ───────────────────────────────────── */

function Downloads({ section }: { section: BusinessPlanCopy['downloads'] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">
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
