import { getTranslations } from 'next-intl/server'
import { ArrowRight, ExternalLink, BookOpen } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'
import { UpcyclingPageHeader } from '../UpcyclingPageHeader'
import { ogFor } from '../og-images'

/**
 * /projects/upcycling/wirkung — the environmental, scientific, and
 * open-hardware story of the project.
 *
 * Four blocks:
 *   1. Environment — CO₂ + materials + lifespan with cited sources
 *   2. Scientific  — what ZHAW measures and why
 *   3. Open hardware — what we publish, licence, who benefits
 *   4. Circularity — four-stage material flow
 *
 * Each block leans on existing transparency surfaces (/transparenz/co2,
 * the github source, etc) instead of duplicating their content. The
 * numbers shown here are provisional; the ZHAW LCA (Q3 2026) replaces
 * them with rigorous values.
 *
 * Server component — pure render. No interactivity.
 */

type Metric = { value: string; label: string; note: string }
type Stage = { label: string; description: string }

type WirkungCopy = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  environment: {
    eyebrow: string
    title: string
    intro: string
    metrics: Metric[]
    caveat: string
    transparencyLink: string
  }
  scientific: {
    eyebrow: string
    title: string
    intro: string
    scope: string[]
    timeline: string
    commitment: string
  }
  openHardware: {
    eyebrow: string
    title: string
    body: string
    licenseLine: string
    guideCta: string
    sourceLink: { label: string; url: string }
  }
  circularity: {
    eyebrow: string
    title: string
    intro: string
    stages: Stage[]
  }
  nextSteps: {
    eyebrow: string
    title: string
    body: string
    primary: string
    secondary: string
  }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.wirkung') as WirkungCopy
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('wirkung', m.meta),
  }
}

export default async function UpcyclingWirkungPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.wirkung') as WirkungCopy

  return (
    <article className="bg-canvas">
      <Header eyebrow={m.eyebrow} title={m.title} intro={m.intro} />
      <Environment section={m.environment} />
      <Scientific section={m.scientific} />
      <OpenHardware section={m.openHardware} />
      <Circularity section={m.circularity} />
    </article>
  )
}

/* ─── Header ─────────────────────────────────────────────────────── */

function Header({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro: string
}) {
  return <UpcyclingPageHeader eyebrow={eyebrow} title={title} intro={intro} />
}

/* ─── 1. Environment ────────────────────────────────────────────── */
/* Top-line metric(s) with the methodology link sitting ON the card —
 * not orphaned in the caveat paragraph below. Credibility requires that
 * the source be one click from the number, per pattern_co2_credibility.
 * Layout adapts: a single headline metric renders as a featured card;
 * multiple metrics fall back to the original 3-col grid. */

function Environment({ section }: { section: WirkungCopy['environment'] }) {
  const single = section.metrics.length === 1
  return (
    <section
      className="border-b border-subtle bg-canvas"
      aria-labelledby="env-title"
    >
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="env-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        {single ? (
          <HeadlineMetric metric={section.metrics[0]} transparencyLink={section.transparencyLink} />
        ) : (
          <dl className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
            {section.metrics.map((metric, i) => (
              <MetricCard key={i} metric={metric} transparencyLink={section.transparencyLink} />
            ))}
          </dl>
        )}

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-text-secondary">
          {section.caveat}
        </p>
      </div>
    </section>
  )
}

/** Headline-treatment for a single metric: number left, source + methodology
 *  link right. The link sits on the card so a reader who sees the number
 *  has one click to verify it. */
function HeadlineMetric({ metric, transparencyLink }: { metric: Metric; transparencyLink: string }) {
  return (
    <article className="mt-10 grid gap-6 rounded-xl border border-subtle bg-surface-base p-6 sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-10">
      <div className="min-w-0">
        <div className="font-mono text-5xl font-light leading-none tabular-nums text-text-primary sm:text-6xl">
          {metric.value}
        </div>
        <div className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-action">
          {metric.label}
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-text-secondary">{metric.note}</p>
        <Link
          href="/transparenz/co2"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-action underline-offset-2 hover:underline"
        >
          {transparencyLink}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

/** Grid card for the multi-metric layout. Methodology link sits at the
 *  bottom of each card so the per-card credibility chain stays intact
 *  whether one or three metrics are configured. */
function MetricCard({ metric, transparencyLink }: { metric: Metric; transparencyLink: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6">
      <dd className="font-mono text-3xl font-light leading-none tabular-nums text-text-primary sm:text-4xl">
        {metric.value}
      </dd>
      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-action">
        {metric.label}
      </dt>
      <p className="text-xs leading-snug text-text-secondary">{metric.note}</p>
      <Link
        href="/transparenz/co2"
        className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-action underline-offset-2 hover:underline"
      >
        {transparencyLink}
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  )
}

/* ─── 2. Scientific ─────────────────────────────────────────────── */
/* Scope list + timeline + the "publish unchanged" commitment.
 * The commitment line is the most important sentence on this page. */

function Scientific({ section }: { section: WirkungCopy['scientific'] }) {
  return (
    <section
      className="border-b border-subtle bg-surface-raised"
      aria-labelledby="science-title"
    >
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="science-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4">{section.intro}</p>

        <ul className="mt-8 space-y-3 border-l border-subtle pl-5">
          {section.scope.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-text-secondary">
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {section.timeline}
        </p>

        <p className="mt-6 border-l-2 border-action pl-4 text-sm leading-relaxed text-text-primary sm:text-base">
          {section.commitment}
        </p>
      </div>
    </section>
  )
}

/* ─── 3. Open hardware ──────────────────────────────────────────── */

function OpenHardware({ section }: { section: WirkungCopy['openHardware'] }) {
  return (
    <section
      className="border-b border-subtle bg-canvas"
      aria-labelledby="osh-title"
    >
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="osh-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4">{section.body}</p>
        <p className="mt-3 text-sm text-text-secondary">{section.licenseLine}</p>

        <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href={UPCYCLING_ROUTES.buildYourOwn}
            className="inline-flex items-center gap-2 text-sm font-semibold text-action hover:gap-3 transition-all"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {section.guideCta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <a
            href={section.sourceLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-action transition-colors"
          >
            {section.sourceLink.label}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── 4. Circularity ────────────────────────────────────────────── */

function Circularity({ section }: { section: WirkungCopy['circularity'] }) {
  return (
    <section className="bg-surface-raised" aria-labelledby="circ-title">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="ui-public-eyebrow">{section.eyebrow}</div>
        <h2 id="circ-title" className="ui-public-display-md mt-3">
          {section.title}
        </h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <ol className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {section.stages.map((stage, i) => (
            <li
              key={i}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-subtle bg-surface-base p-6"
            >
              <span
                aria-hidden="true"
                className="font-mono text-xs tabular-nums text-text-tertiary"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-text-primary">{stage.label}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {stage.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
