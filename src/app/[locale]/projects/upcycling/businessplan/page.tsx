import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { ArrowRight, ExternalLink, Mail, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /projects/upcycling/businessplan — source-grounded evidence page.
 *
 * Every claim, number and proper noun is in messages/<lc>.json under
 * projects.upcycling.businessPlan, anchored to a citation in the
 * `belege.citations` block. SSOT enforced by
 * `npm run i18n:businessplan` (scripts/i18n-businessplan-parity.mjs):
 *   - identical key shape across all 8 locales
 *   - numeric values, dates, URLs, photo paths byte-identical to DE
 *
 * Page structure: see /home/g/.claude/plans/playful-forging-widget.md.
 * 15 anchored sections, sticky left rail TOC on lg+, mobile select on
 * smaller. Server component, native <details> for progressive disclosure,
 * zero client JS.
 */

/* ─── Types ────────────────────────────────────────────────────────── */

type Cite = string | null

type NavItem = { id: string; label: string }

type Kpi = { label: string; value: string; note: string; cite: Cite }

type BuildStep = { title: string; body: string; cite: Cite; linkLabel?: string; linkUrl?: string }

type Photo = { src: string; caption: string }

type StockRow = { label: string; value: string; emphasis?: boolean; note?: string }

type Channel = { label: string; body: string; cite: Cite; linkLabel?: string; linkUrl?: string }

type AlternativeRow = { label: string; price: string; note: string; cite: Cite; linkLabel: string | null; linkUrl: string | null; isOurs?: boolean }

type Segment = { label: string; body: string; cite: Cite }

type BudgetRow = { label: string; value: string; note?: string; emphasis?: boolean }

type FactRow = { label: string; value: string; cite: Cite; linkLabel?: string; linkUrl?: string }

type TimelinePhase = { label: string; date: string }

type PartnerItem = { name: string; role: string; cite: Cite; linkLabel?: string; linkUrl?: string }

type PartnerGroup = { title: string; intro?: string; items: PartnerItem[] }

type RiskItem = { label: string; status: string; body: string; cite: Cite }

type FundingLine = { label: string; status: string; amount: string; note: string; cite: Cite }

type GetInvolved = { key: string; title: string; body: string; ctaLabel: string; ctaHref: string; cite: Cite }

type Citation = { key: string; label: string; detail: string; url: string | null }

type BusinessPlan = {
  meta: { title: string; description: string }
  nav: { label: string; items: NavItem[] }
  hero: { eyebrow: string; title: string; intro: string; heroImage: string; heroImageAlt: string }
  status: { eyebrow: string; title: string; intro: string; kpis: Kpi[] }
  produkt: {
    eyebrow: string; title: string; intro: string
    buildSteps: { title: string; steps: BuildStep[] }
    photoGallery: { title: string; intro: string; items: Photo[] }
    links: { label: string; url: string }[]
  }
  lieferanten: {
    eyebrow: string; title: string; intro: string
    stockBreakdown: { title: string; subtitle: string; rows: StockRow[]; cite: Cite }
    channels: { title: string; items: Channel[] }
    criteria: { title: string; items: string[]; cite: Cite }
    rejected: { title: string; items: string[]; cite: Cite }
  }
  alternativen: {
    eyebrow: string; title: string; intro: string
    benchmarkPhoto: Photo
    alternativesTable: { title: string; rows: AlternativeRow[] }
    verdict: string
  }
  kunden: {
    eyebrow: string; title: string; intro: string; segments: Segment[]
    pilotPlan: { title: string; intro: string; items: string[]; cite: Cite }
  }
  wirtschaftlichkeit: {
    eyebrow: string; title: string; intro: string
    budget: { title: string; note: string; rows: BudgetRow[]; cite: Cite }
    scopeNote: string; scopeCite: Cite
  }
  wissenschaft: {
    eyebrow: string; title: string; intro: string
    factsheet: { title: string; rows: FactRow[] }
    timeline: { title: string; phases: TimelinePhase[]; cite: Cite }
    scope: { title: string; items: string[]; cite: Cite }
    history: string; historyCite: Cite
  }
  ce: {
    eyebrow: string; title: string; intro: string
    approach: { title: string; items: { label: string; body: string; cite: Cite }[] }
  }
  partner: {
    eyebrow: string; title: string; intro: string
    groups: PartnerGroup[]
    klimastNote: string; klimastCite: Cite
  }
  risiken: { eyebrow: string; title: string; intro: string; items: RiskItem[] }
  foerderung: { eyebrow: string; title: string; intro: string; lines: FundingLine[] }
  mitmachen: { eyebrow: string; title: string; intro: string; options: GetInvolved[] }
  belege: { eyebrow: string; title: string; intro: string; citations: Citation[] }
}

/* ─── Metadata + page entry ────────────────────────────────────────── */

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlan
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default async function UpcyclingBusinessPlanPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlan
  const citeMap = new Map(m.belege.citations.map((c, i) => [c.key, i + 1]))

  return (
    <article className="bg-canvas">
      <Hero hero={m.hero} />
      <MobileToc nav={m.nav} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <DesktopTocRail nav={m.nav} />
          <main className="min-w-0">
            <Status section={m.status} citeMap={citeMap} />
            <Produkt section={m.produkt} />
            <Lieferanten section={m.lieferanten} citeMap={citeMap} />
            <Alternativen section={m.alternativen} citeMap={citeMap} />
            <Kunden section={m.kunden} citeMap={citeMap} />
            <Wirtschaftlichkeit section={m.wirtschaftlichkeit} citeMap={citeMap} />
            <Wissenschaft section={m.wissenschaft} citeMap={citeMap} />
            <CE section={m.ce} citeMap={citeMap} />
            <Partner section={m.partner} citeMap={citeMap} />
            <Risiken section={m.risiken} citeMap={citeMap} />
            <Foerderung section={m.foerderung} citeMap={citeMap} />
            <Mitmachen section={m.mitmachen} />
            <Belege section={m.belege} />
          </main>
        </div>
      </div>
    </article>
  )
}

/* ─── Citation rendering ──────────────────────────────────────────── */

function Cite({ k, citeMap }: { k: Cite; citeMap: Map<string, number> }) {
  if (!k) return null
  const n = citeMap.get(k)
  if (!n) return null
  return (
    <a
      href={`#belege-${k}`}
      className="ml-1 inline-flex align-baseline rounded-sm bg-surface-raised px-1 text-[10px] font-mono text-text-tertiary no-underline hover:bg-action-muted hover:text-action"
      aria-label={`Beleg ${n}`}
    >
      [{n}]
    </a>
  )
}

/* ─── Hero ─────────────────────────────────────────────────────────── */

function Hero({ hero }: { hero: BusinessPlan['hero'] }) {
  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0">
            <div className="ui-public-eyebrow">{hero.eyebrow}</div>
            <h1 className="ui-public-display-lg mt-3">{hero.title}</h1>
            <p className="ui-public-section-lede mt-4 max-w-2xl">{hero.intro}</p>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-subtle bg-canvas">
            <Image
              src={hero.heroImage}
              alt={hero.heroImageAlt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              unoptimized
              priority
            />
          </figure>
        </div>
      </div>
    </header>
  )
}

/* ─── TOC: desktop rail + mobile select ───────────────────────────── */

function DesktopTocRail({ nav }: { nav: BusinessPlan['nav'] }) {
  return (
    <nav aria-label={nav.label} className="ui-public-toc-rail hidden lg:block">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-3">
        {nav.label}
      </p>
      <ul className="space-y-1.5 text-sm">
        {nav.items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1.5 text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function MobileToc({ nav }: { nav: BusinessPlan['nav'] }) {
  // Server-renderable mobile TOC: a native <select> wrapped in a tiny
  // inline script that navigates on change. No React state, no JS bundle.
  return (
    <nav aria-label={nav.label} className="ui-sticky-subnav lg:hidden border-b border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/75">
      <div className="mx-auto max-w-5xl px-4 py-2.5 sm:px-6">
        <label className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary shrink-0">
            {nav.label}
          </span>
          <select
            className="flex-1 min-w-0 rounded-md border border-default bg-surface-base px-2 py-1.5 text-sm text-text-primary"
            defaultValue=""
            onChange={
               
              undefined
            }
            // Inline JS handler — server component allows this attribute string
            // because next/script isn't needed for a one-line nav handler.
            {...{ onchange: "if(this.value){location.hash=this.value}" }}
          >
            <option value="">— {nav.label} —</option>
            {nav.items.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  )
}

/* ─── Section wrapper ─────────────────────────────────────────────── */

function Section({
  id,
  tone = 'canvas',
  children,
}: {
  id: string
  tone?: 'canvas' | 'raised' | 'base'
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        'border-b border-subtle scroll-mt-24 sm:scroll-mt-28',
        tone === 'canvas' && 'bg-canvas',
        tone === 'raised' && 'bg-surface-raised -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0',
        tone === 'base'   && 'bg-surface-base -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0',
      )}
    >
      <div className="py-14 sm:py-16">{children}</div>
    </section>
  )
}

/* ─── 1. Status ────────────────────────────────────────────────────── */

function Status({ section, citeMap }: { section: BusinessPlan['status']; citeMap: Map<string, number> }) {
  return (
    <Section id="status" tone="base">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {section.kpis.map((k) => (
          <li key={k.label} className="rounded-xl border border-subtle bg-canvas p-5">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-action">{k.label}</div>
            <div className="mt-2 font-mono text-xl font-light tabular-nums text-text-primary">{k.value}</div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {k.note}<Cite k={k.cite} citeMap={citeMap} />
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 2. Was wir bauen ────────────────────────────────────────────── */

function Produkt({ section }: { section: BusinessPlan['produkt'] }) {
  return (
    <Section id="produkt" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">{section.buildSteps.title}</h3>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2">
        {section.buildSteps.steps.map((s, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-base p-5">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">{`Schritt ${i + 1}`}</span>
            <h4 className="text-base font-semibold text-text-primary">{s.title}</h4>
            <p className="text-sm leading-relaxed text-text-secondary">{s.body}</p>
            {s.linkUrl && s.linkLabel && (
              <a href={s.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-medium text-action hover:underline underline-offset-2">
                {s.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ol>

      <h3 className="mt-12 text-lg font-semibold text-text-primary">{section.photoGallery.title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{section.photoGallery.intro}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.photoGallery.items.map((p) => (
          <li key={p.src} className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-3">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-lg bg-canvas">
              <Image
                src={p.src}
                alt={p.caption}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </figure>
            <figcaption className="text-xs leading-relaxed text-text-secondary">{p.caption}</figcaption>
          </li>
        ))}
      </ul>

      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {section.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-action hover:underline underline-offset-2">
              {l.label}<ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 3. Lieferanten ──────────────────────────────────────────────── */

function Lieferanten({ section, citeMap }: { section: BusinessPlan['lieferanten']; citeMap: Map<string, number> }) {
  return (
    <Section id="lieferanten" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <div className="mt-8 rounded-xl border border-subtle bg-surface-base p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-text-primary">{section.stockBreakdown.title}</h3>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">{section.stockBreakdown.subtitle}</p>
        <dl className="mt-4 divide-y divide-subtle border-y border-subtle">
          {section.stockBreakdown.rows.map((r, i) => (
            <div key={i} className={cn('grid grid-cols-[1fr_auto] gap-x-4 py-3 sm:gap-x-6', r.emphasis && 'bg-action-muted/40 -mx-4 px-4 sm:-mx-6 sm:px-6')}>
              <dt className={cn('text-sm text-text-primary', r.emphasis && 'font-semibold')}>{r.label}{r.note && <span className="ml-2 text-xs text-action">{r.note}</span>}</dt>
              <dd className={cn('font-mono text-sm tabular-nums text-text-primary', r.emphasis && 'font-semibold')}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-text-tertiary">Quelle:<Cite k={section.stockBreakdown.cite} citeMap={citeMap} /></p>
      </div>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">{section.channels.title}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {section.channels.items.map((c, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-5">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-action">{c.label}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{c.body}<Cite k={c.cite} citeMap={citeMap} /></p>
            {c.linkUrl && c.linkLabel && (
              <a href={c.linkUrl} {...(c.linkUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline underline-offset-2">
                {c.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <CriteriaCard variant="accept" title={section.criteria.title} items={section.criteria.items} cite={section.criteria.cite} citeMap={citeMap} />
        <CriteriaCard variant="reject" title={section.rejected.title} items={section.rejected.items} cite={section.rejected.cite} citeMap={citeMap} />
      </div>
    </Section>
  )
}

function CriteriaCard({ variant, title, items, cite, citeMap }: { variant: 'accept' | 'reject'; title: string; items: string[]; cite: Cite; citeMap: Map<string, number> }) {
  const Icon = variant === 'accept' ? Check : X
  return (
    <div className="min-w-0 rounded-xl border border-subtle bg-surface-base p-6">
      <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-action">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', variant === 'accept' ? 'text-action' : 'text-text-tertiary')} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-text-tertiary">Quelle:<Cite k={cite} citeMap={citeMap} /></p>
    </div>
  )
}

/* ─── 4. Alternativen am Markt ────────────────────────────────────── */

function Alternativen({ section, citeMap }: { section: BusinessPlan['alternativen']; citeMap: Map<string, number> }) {
  return (
    <Section id="alternativen" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <figure className="mt-8 grid gap-6 rounded-xl border border-subtle bg-surface-base p-4 sm:grid-cols-[1.2fr_1fr] sm:p-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-canvas">
          <Image src={section.benchmarkPhoto.src} alt={section.benchmarkPhoto.caption} fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" unoptimized />
        </div>
        <figcaption className="self-center text-sm leading-relaxed text-text-secondary">{section.benchmarkPhoto.caption}</figcaption>
      </figure>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">{section.alternativesTable.title}</h3>
      <ul className="mt-4 divide-y divide-subtle border-y border-subtle">
        {section.alternativesTable.rows.map((alt, i) => (
          <li key={i} className={cn('grid grid-cols-1 gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6', alt.isOurs && 'bg-action-muted/30 -mx-4 px-4 sm:-mx-6 sm:px-6')}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-sm font-medium text-text-primary sm:text-base', alt.isOurs && 'text-action')}>{alt.label}</span>
                {alt.linkUrl && alt.linkLabel && (
                  <a href={alt.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-action hover:underline" aria-label={`${alt.label} — Quelle`}>
                    {alt.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">{alt.note}<Cite k={alt.cite} citeMap={citeMap} /></p>
            </div>
            <div className="font-mono text-sm tabular-nums text-text-primary sm:text-base sm:text-right">{alt.price}</div>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
        <span className="mr-2 font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">→</span>{section.verdict}
      </p>
    </Section>
  )
}

/* ─── 5. Kunden ──────────────────────────────────────────────────── */

function Kunden({ section, citeMap }: { section: BusinessPlan['kunden']; citeMap: Map<string, number> }) {
  return (
    <Section id="kunden" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ul className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
        {section.segments.map((s, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">{s.label}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{s.body}<Cite k={s.cite} citeMap={citeMap} /></p>
          </li>
        ))}
      </ul>

      <details className="mt-8 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <span><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary mr-2">DETAIL</span>{section.pilotPlan.title}</span>
          <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">
          <p>{section.pilotPlan.intro}</p>
          <ul className="mt-3 space-y-1">
            {section.pilotPlan.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden="true" className="font-mono text-text-tertiary">·</span>{it}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-tertiary">Quelle:<Cite k={section.pilotPlan.cite} citeMap={citeMap} /></p>
        </div>
      </details>
    </Section>
  )
}

/* ─── 6. Wirtschaftlichkeit ──────────────────────────────────────── */

function Wirtschaftlichkeit({ section, citeMap }: { section: BusinessPlan['wirtschaftlichkeit']; citeMap: Map<string, number> }) {
  return (
    <Section id="wirtschaftlichkeit" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <div className="mt-8 rounded-xl border border-subtle bg-surface-base p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-text-primary">{section.budget.title}</h3>
        <p className="mt-2 text-sm text-text-secondary">{section.budget.note}</p>
        <dl className="mt-5 divide-y divide-subtle border-y border-subtle">
          {section.budget.rows.map((r, i) => (
            <div key={i} className={cn('grid grid-cols-[1fr_auto] gap-x-4 py-3 sm:gap-x-6', r.emphasis && 'bg-action-muted/40 -mx-4 px-4 sm:-mx-6 sm:px-6')}>
              <dt className={cn('text-sm leading-snug text-text-primary', r.emphasis && 'font-semibold')}>{r.label}{r.note && <span className="ml-2 text-xs text-text-tertiary">{r.note}</span>}</dt>
              <dd className={cn('font-mono text-sm tabular-nums text-text-primary', r.emphasis && 'font-semibold')}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-text-tertiary">Quelle:<Cite k={section.budget.cite} citeMap={citeMap} /></p>
      </div>

      <p className="mt-6 max-w-3xl rounded-xl border border-dashed border-subtle bg-canvas p-5 text-sm leading-relaxed text-text-secondary">
        {section.scopeNote}<Cite k={section.scopeCite} citeMap={citeMap} />
      </p>
    </Section>
  )
}

/* ─── 7. Wissenschaftliche Begleitung ─────────────────────────────── */

function Wissenschaft({ section, citeMap }: { section: BusinessPlan['wissenschaft']; citeMap: Map<string, number> }) {
  return (
    <Section id="wissenschaft" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <div className="mt-8 rounded-xl border border-subtle bg-surface-base p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-text-primary">{section.factsheet.title}</h3>
        <dl className="mt-4 divide-y divide-subtle border-y border-subtle">
          {section.factsheet.rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-x-6">
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">{r.label}</dt>
              <dd className="text-sm text-text-primary">{r.value}<Cite k={r.cite} citeMap={citeMap} />{r.linkUrl && r.linkLabel && (<> · <a href={r.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-action hover:underline">{r.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a></>)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <details className="mt-6 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <span><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary mr-2">PLAN</span>{section.timeline.title}</span>
          <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <ol className="px-5 pb-5 divide-y divide-subtle border-t border-subtle">
          {section.timeline.phases.map((p, i) => (
            <li key={i} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-x-6">
              <span className="text-sm text-text-primary">{p.label}</span>
              <span className="font-mono text-xs tabular-nums text-text-tertiary sm:text-right">{p.date}</span>
            </li>
          ))}
          <li className="pt-3 text-xs text-text-tertiary">Quelle:<Cite k={section.timeline.cite} citeMap={citeMap} /></li>
        </ol>
      </details>

      <details className="mt-4 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <span><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary mr-2">UMFANG</span>{section.scope.title}</span>
          <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">
          <ul className="space-y-2">
            {section.scope.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2"><span aria-hidden="true" className="mt-1 font-mono text-text-tertiary">·</span>{it}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-tertiary">Quelle:<Cite k={section.scope.cite} citeMap={citeMap} /></p>
        </div>
      </details>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary">
        {section.history}<Cite k={section.historyCite} citeMap={citeMap} />
      </p>
    </Section>
  )
}

/* ─── 8. CE-Konformität ────────────────────────────────────────── */

function CE({ section, citeMap }: { section: BusinessPlan['ce']; citeMap: Map<string, number> }) {
  return (
    <Section id="ce" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <h3 className="mt-8 text-lg font-semibold text-text-primary">{section.approach.title}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {section.approach.items.map((it, i) => (
          <li key={i} className="rounded-xl border border-subtle bg-surface-base p-5">
            <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-action">{it.label}</h4>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{it.body}<Cite k={it.cite} citeMap={citeMap} /></p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 9. Partner ──────────────────────────────────────────────── */

function Partner({ section, citeMap }: { section: BusinessPlan['partner']; citeMap: Map<string, number> }) {
  return (
    <Section id="partner" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.groups.map((g, gi) => (
          <details key={gi} open={gi < 2} className="group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">{g.title}</span>
              <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="px-5 pb-5 space-y-3 text-sm leading-relaxed">
              {g.intro && <p className="text-text-tertiary text-xs">{g.intro}</p>}
              <ul className="space-y-3">
                {g.items.map((it, i) => (
                  <li key={i} className="border-t border-subtle pt-3 first:border-t-0 first:pt-0">
                    <div className="font-medium text-text-primary">{it.name}{it.linkUrl && it.linkLabel && (<> · <a href={it.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-action hover:underline">{it.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a></>)}</div>
                    <p className="mt-0.5 text-text-secondary">{it.role}<Cite k={it.cite} citeMap={citeMap} /></p>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>

      <p className="mt-6 max-w-3xl rounded-xl border border-dashed border-subtle bg-surface-base p-5 text-sm leading-relaxed text-text-secondary">
        {section.klimastNote}<Cite k={section.klimastCite} citeMap={citeMap} />
      </p>
    </Section>
  )
}

/* ─── 10. Risiken ─────────────────────────────────────────────── */

function Risiken({ section, citeMap }: { section: BusinessPlan['risiken']; citeMap: Map<string, number> }) {
  return (
    <Section id="risiken" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ul className="mt-8 space-y-3">
        {section.items.map((r, i) => (
          <li key={i} className="rounded-xl border border-subtle bg-surface-base">
            <details className="group">
              <summary className="cursor-pointer list-none px-5 py-4 flex items-start gap-4">
                <span className="flex-1 text-sm font-medium text-text-primary sm:text-base">{r.label}</span>
                <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-action">{r.status}</span>
                <span aria-hidden="true" className="mt-1 font-mono text-text-tertiary transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{r.body}<Cite k={r.cite} citeMap={citeMap} /></p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 11. Förderung ─────────────────────────────────────────── */

function Foerderung({ section, citeMap }: { section: BusinessPlan['foerderung']; citeMap: Map<string, number> }) {
  return (
    <Section id="foerderung" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ul className="mt-8 divide-y divide-subtle border-y border-subtle">
        {section.lines.map((l, i) => (
          <li key={i} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[1.4fr_auto_auto] sm:items-baseline sm:gap-x-6">
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary sm:text-base">{l.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">{l.note}<Cite k={l.cite} citeMap={citeMap} /></p>
            </div>
            <span className="rounded-full bg-surface-base px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-action sm:self-start">{l.status}</span>
            <span className="font-mono text-sm tabular-nums text-text-primary sm:text-right">{l.amount}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 12. Mitmachen ─────────────────────────────────────────── */

function Mitmachen({ section }: { section: BusinessPlan['mitmachen'] }) {
  return (
    <Section id="mitmachen" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {section.options.map((o) => (
          <li key={o.key} className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6">
            <h3 className="text-base font-semibold text-text-primary">{o.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{o.body}</p>
            <a href={o.ctaHref} {...(o.ctaHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-action hover:underline underline-offset-2">
              {o.ctaLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 13. Belege & Quellen ─────────────────────────────────── */

function Belege({ section }: { section: BusinessPlan['belege'] }) {
  return (
    <Section id="belege" tone="base">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ol className="mt-8 space-y-3">
        {section.citations.map((c, i) => (
          <li id={`belege-${c.key}`} key={c.key} className="scroll-mt-28 rounded-lg border border-subtle bg-canvas p-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-action shrink-0">[{i + 1}]</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary">{c.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{c.detail}</p>
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-action hover:underline">
                    <Mail className="h-3 w-3" aria-hidden="true" />{c.url}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
