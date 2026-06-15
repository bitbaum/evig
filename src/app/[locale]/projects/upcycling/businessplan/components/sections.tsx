import Image from 'next/image'
import { ArrowRight, ExternalLink, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusinessPlan, BusinessPlanUi } from '../types'
import {
  Cite,
  CriteriaCard,
  DisclosureSummary,
  Section,
  SourceLine,
  formatStepLabel,
} from './primitives'

/* ─── Executive summary ───────────────────────────────────────────── */

export function ExecutiveSummary({ section }: { section: BusinessPlan['executiveSummary'] }) {
  return (
    <Section id="zusammenfassung" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-text-secondary sm:text-base">
        {section.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {section.highlights.map((h) => (
          <div key={h.label} className="rounded-xl border border-subtle bg-surface-base px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">{h.label}</dt>
            <dd className="mt-1 font-mono text-lg font-light tabular-nums text-text-primary">{h.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

/* ─── 1. Status ────────────────────────────────────────────────────── */

export function Status({ section, citeMap, ui }: { section: BusinessPlan['status']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
              {k.note}<Cite k={k.cite} citeMap={citeMap} ui={ui} />
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 2. Was wir bauen ────────────────────────────────────────────── */

export function Produkt({ section, ui }: { section: BusinessPlan['produkt']; ui: BusinessPlanUi }) {
  return (
    <Section id="produkt" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">{section.buildSteps.title}</h3>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2">
        {section.buildSteps.steps.map((s, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-base p-5">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">{formatStepLabel(ui.step, i + 1)}</span>
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
              {/* Photos are pre-compressed (max 1600px, mozjpeg q82). Letting
                  Next/Image transcode to AVIF/WebP + size them per breakpoint
                  is a further 2-4x savings on most clients. */}
              <Image
                src={p.src}
                alt={p.caption}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="object-cover"
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

export function Lieferanten({ section, citeMap, ui }: { section: BusinessPlan['lieferanten']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
        <SourceLine cite={section.stockBreakdown.cite} citeMap={citeMap} ui={ui} />
      </div>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">{section.channels.title}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {section.channels.items.map((c, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-5">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-action">{c.label}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{c.body}<Cite k={c.cite} citeMap={citeMap} ui={ui} /></p>
            {c.linkUrl && c.linkLabel && (
              <a href={c.linkUrl} {...(c.linkUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline underline-offset-2">
                {c.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <CriteriaCard variant="accept" title={section.criteria.title} items={section.criteria.items} cite={section.criteria.cite} citeMap={citeMap} ui={ui} />
        <CriteriaCard variant="reject" title={section.rejected.title} items={section.rejected.items} cite={section.rejected.cite} citeMap={citeMap} ui={ui} />
      </div>
    </Section>
  )
}

/* ─── 4. Alternativen am Markt ────────────────────────────────────── */

export function Alternativen({ section, citeMap, ui }: { section: BusinessPlan['alternativen']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
  return (
    <Section id="alternativen" tone="canvas">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <figure className="mt-8 grid gap-6 rounded-xl border border-subtle bg-surface-base p-4 sm:grid-cols-[1.2fr_1fr] sm:p-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-canvas">
          <Image src={section.benchmarkPhoto.src} alt={section.benchmarkPhoto.caption} fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" />
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
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">{alt.note}<Cite k={alt.cite} citeMap={citeMap} ui={ui} /></p>
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

export function Kunden({ section, citeMap, ui }: { section: BusinessPlan['kunden']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
  return (
    <Section id="kunden" tone="raised">
      <div className="ui-public-eyebrow">{section.eyebrow}</div>
      <h2 className="ui-public-display-md mt-3">{section.title}</h2>
      <p className="ui-public-section-lede mt-3 max-w-3xl">{section.intro}</p>

      <ul className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">
        {section.segments.map((s, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-action">{s.label}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{s.body}<Cite k={s.cite} citeMap={citeMap} ui={ui} /></p>
          </li>
        ))}
      </ul>

      <details className="mt-8 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <DisclosureSummary badge={ui.badges.detail} title={section.pilotPlan.title} />
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
          <SourceLine cite={section.pilotPlan.cite} citeMap={citeMap} ui={ui} />
        </div>
      </details>
    </Section>
  )
}

/* ─── 6. Wirtschaftlichkeit ──────────────────────────────────────── */

export function Wirtschaftlichkeit({ section, citeMap, ui }: { section: BusinessPlan['wirtschaftlichkeit']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
        <SourceLine cite={section.budget.cite} citeMap={citeMap} ui={ui} />
      </div>

      <p className="mt-6 max-w-3xl rounded-xl border border-dashed border-subtle bg-canvas p-5 text-sm leading-relaxed text-text-secondary">
        {section.scopeNote}<Cite k={section.scopeCite} citeMap={citeMap} ui={ui} />
      </p>
    </Section>
  )
}

/* ─── 7. Wissenschaftliche Begleitung ─────────────────────────────── */

export function Wissenschaft({ section, citeMap, ui }: { section: BusinessPlan['wissenschaft']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
              <dd className="text-sm text-text-primary">{r.value}<Cite k={r.cite} citeMap={citeMap} ui={ui} />{r.linkUrl && r.linkLabel && (<> · <a href={r.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-action hover:underline">{r.linkLabel}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a></>)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <details className="mt-6 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <DisclosureSummary badge={ui.badges.plan} title={section.timeline.title} />
        </summary>
        <ol className="px-5 pb-5 divide-y divide-subtle border-t border-subtle">
          {section.timeline.phases.map((p, i) => (
            <li key={i} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-x-6">
              <span className="text-sm text-text-primary">{p.label}</span>
              <span className="font-mono text-xs tabular-nums text-text-tertiary sm:text-right">{p.date}</span>
            </li>
          ))}
          <li className="pt-3"><SourceLine cite={section.timeline.cite} citeMap={citeMap} ui={ui} /></li>
        </ol>
      </details>

      <details className="mt-4 group rounded-xl border border-subtle bg-surface-base open:bg-canvas">
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium text-text-secondary hover:text-text-primary">
          <DisclosureSummary badge={ui.badges.scope} title={section.scope.title} />
        </summary>
        <div className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">
          <ul className="space-y-2">
            {section.scope.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2"><span aria-hidden="true" className="mt-1 font-mono text-text-tertiary">·</span>{it}</li>
            ))}
          </ul>
          <SourceLine cite={section.scope.cite} citeMap={citeMap} ui={ui} />
        </div>
      </details>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary">
        {section.history}<Cite k={section.historyCite} citeMap={citeMap} ui={ui} />
      </p>
    </Section>
  )
}

/* ─── 8. CE-Konformität ────────────────────────────────────────── */

export function CE({ section, citeMap, ui }: { section: BusinessPlan['ce']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{it.body}<Cite k={it.cite} citeMap={citeMap} ui={ui} /></p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 9. Partner ──────────────────────────────────────────────── */

export function Partner({ section, citeMap, ui }: { section: BusinessPlan['partner']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
                    <p className="mt-0.5 text-text-secondary">{it.role}<Cite k={it.cite} citeMap={citeMap} ui={ui} /></p>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>

      <p className="mt-6 max-w-3xl rounded-xl border border-dashed border-subtle bg-surface-base p-5 text-sm leading-relaxed text-text-secondary">
        {section.klimastNote}<Cite k={section.klimastCite} citeMap={citeMap} ui={ui} />
      </p>
    </Section>
  )
}

/* ─── 10. Risiken ─────────────────────────────────────────────── */

export function Risiken({ section, citeMap, ui }: { section: BusinessPlan['risiken']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
              <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{r.body}<Cite k={r.cite} citeMap={citeMap} ui={ui} /></p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─── 11. Förderung ─────────────────────────────────────────── */

export function Foerderung({ section, citeMap, ui }: { section: BusinessPlan['foerderung']; citeMap: Map<string, number>; ui: BusinessPlanUi }) {
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
              <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">{l.note}<Cite k={l.cite} citeMap={citeMap} ui={ui} /></p>
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

export function Mitmachen({ section }: { section: BusinessPlan['mitmachen'] }) {
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

export function Belege({ section }: { section: BusinessPlan['belege'] }) {
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
