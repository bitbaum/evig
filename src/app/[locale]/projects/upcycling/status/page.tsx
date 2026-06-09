import { getTranslations } from 'next-intl/server'
import { ArrowRight, CheckCircle2, CircleDot, Circle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  UPCYCLING_STATUS,
  type MilestoneKey,
  type MilestoneStatus,
} from '@/data/upcycling-status'
import { cn } from '@/lib/utils'

/**
 * /projects/upcycling/status — funder, partner, and press surface.
 *
 * Purpose: a single shareable URL that says "where the project stands
 * today" with honesty (no fabricated metrics) and a clear forward path.
 * Drives three downstream actions: fund, host a pilot, donate monitors.
 *
 * SoC: numbers come from src/data/upcycling-status.ts (project SSOT);
 *      text comes from messages/<locale>.json (i18n SSOT); chrome flows
 *      through semantic CSS-var tokens.
 *
 * Server component because nothing here is interactive — the data is
 * known at render time and refreshes when the team edits the data file.
 */

type Milestone = {
  key: MilestoneKey
  date: string
  label: string
}

type StatusMessages = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  snapshot: { label: string; updatedLabel: string }
  production: {
    title: string
    intro: string
    lampsLabel: string
    lampsOf: string
    lampsTarget: string
    modelsLabel: string
    pilotsLabel: string
    intakeLabel: string
  }
  timeline: {
    title: string
    intro: string
    labels: Record<MilestoneStatus, string>
    items: Milestone[]
  }
  partners: {
    title: string
    intro: string
    groups: { key: string; title: string; names: string[] }[]
  }
  calls: {
    title: string
    intro: string
    actions: { key: 'fund' | 'pilot' | 'donate'; title: string; description: string; cta: string }[]
  }
}

const CALL_HREF: Record<'fund' | 'pilot' | 'donate', string> = {
  fund: '/contact',
  pilot: '/contact',
  donate: '/get-involved/donate',
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.status') as StatusMessages
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default async function UpcyclingStatusPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.status') as StatusMessages
  const status = UPCYCLING_STATUS

  return (
    <article className="bg-canvas">
      <Header
        eyebrow={m.eyebrow}
        title={m.title}
        intro={m.intro}
        snapshot={m.snapshot}
        snapshotIso={status.snapshotIso}
      />
      <Production section={m.production} numbers={status.production} />
      <Timeline section={m.timeline} statuses={status.milestoneStatuses} />
      <Partners section={m.partners} />
      <Calls section={m.calls} />
    </article>
  )
}

/* ─── Header ─────────────────────────────────────────────────────── */

function Header({
  eyebrow,
  title,
  intro,
  snapshot,
  snapshotIso,
}: {
  eyebrow: string
  title: string
  intro: string
  snapshot: StatusMessages['snapshot']
  snapshotIso: string
}) {
  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <div className="ui-public-eyebrow">{eyebrow}</div>
          <time
            dateTime={snapshotIso}
            className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
          >
            {snapshot.label} {formatSnapshotDate(snapshotIso)}
          </time>
        </div>
        <h1 className="ui-public-display-lg mt-3">{title}</h1>
        <p className="ui-public-section-lede mt-4">{intro}</p>
      </div>
    </header>
  )
}

/** Format an ISO date string in the "8. Jun 2026" Swiss-German style.
 *  Pure render-time string formatting; no Date.now() / Math.random()
 *  so workflow caches stay stable. */
function formatSnapshotDate(iso: string): string {
  const [y, mo, d] = iso.split('-').map((s) => Number(s))
  const months = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return `${d}. ${months[mo - 1]} ${y}`
}

/* ─── Production ────────────────────────────────────────────────── */

function Production({
  section,
  numbers,
}: {
  section: StatusMessages['production']
  numbers: typeof UPCYCLING_STATUS.production
}) {
  const percent = numbers.lampsTarget > 0
    ? Math.min(100, Math.round((numbers.lampsBuilt / numbers.lampsTarget) * 100))
    : 0

  return (
    <section className="border-b border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          {/* Lamps built — the headline figure. */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-6xl font-light leading-none tabular-nums text-text-primary sm:text-7xl">
                {numbers.lampsBuilt}
              </span>
              <span className="font-mono text-xl text-text-tertiary sm:text-2xl">
                {section.lampsOf} {numbers.lampsTarget}
              </span>
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
              {section.lampsLabel} · {section.lampsTarget}
            </div>

            <div className="mt-6">
              <div
                className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={numbers.lampsTarget}
                aria-valuenow={numbers.lampsBuilt}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-action"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-xs tabular-nums text-text-tertiary">
                {percent}%
              </div>
            </div>
          </div>

          {/* Secondary production metrics. */}
          <dl className="grid grid-cols-3 gap-4 sm:gap-6">
            <SecondaryMetric label={section.modelsLabel} value={numbers.modelsDocumented} />
            <SecondaryMetric label={section.pilotsLabel} value={numbers.pilotsActive} />
            <SecondaryMetric label={section.intakeLabel} value={numbers.monitorsInIntake} />
          </dl>
        </div>
      </div>
    </section>
  )
}

function SecondaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2">
      <dd className="font-mono text-3xl font-light leading-none tabular-nums text-text-primary sm:text-4xl">
        {value}
      </dd>
      <dt className="text-xs uppercase tracking-[0.18em] text-text-tertiary">{label}</dt>
    </div>
  )
}

/* ─── Timeline ──────────────────────────────────────────────────── */

const MILESTONE_ICON: Record<MilestoneStatus, typeof CheckCircle2> = {
  done:     CheckCircle2,
  active:   CircleDot,
  upcoming: Circle,
}

function Timeline({
  section,
  statuses,
}: {
  section: StatusMessages['timeline']
  statuses: Record<MilestoneKey, MilestoneStatus>
}) {
  return (
    <section className="border-b border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <ol className="mt-10 space-y-0 border-l border-subtle">
          {section.items.map((item) => {
            const status = statuses[item.key] ?? 'upcoming'
            const Icon = MILESTONE_ICON[status]
            return (
              <li key={item.key} className="relative -ml-px flex gap-4 pb-8 pl-6 last:pb-0 sm:gap-6 sm:pl-8">
                <span
                  aria-label={section.labels[status]}
                  className={cn(
                    'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-canvas',
                    status === 'active' && 'text-action',
                    status === 'done' && 'text-action',
                    status === 'upcoming' && 'text-text-tertiary',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {item.date} · {section.labels[status]}
                  </div>
                  <div className="mt-1.5 text-base font-medium text-text-primary sm:text-lg">
                    {item.label}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ─── Partners ──────────────────────────────────────────────────── */

function Partners({ section }: { section: StatusMessages['partners'] }) {
  return (
    <section className="border-b border-subtle bg-surface-raised">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {section.groups.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-subtle bg-surface-base p-6"
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

/* ─── Calls to action ───────────────────────────────────────────── */

function Calls({ section }: { section: StatusMessages['calls'] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">{section.title}</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{section.intro}</p>

        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
          {section.actions.map((action) => (
            <Link
              key={action.key}
              href={CALL_HREF[action.key]}
              className="group flex flex-col rounded-xl border border-subtle bg-surface-base p-6 transition-colors hover:border-default"
            >
              <h3 className="text-lg font-semibold text-text-primary">{action.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {action.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-action transition-all group-hover:gap-2">
                {action.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
