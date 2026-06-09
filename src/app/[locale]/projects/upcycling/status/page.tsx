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
 * /projects/upcycling/status — public progress snapshot.
 *
 * Single job: "where is the project right now?" Header + production +
 * timeline + a single tail nudge to /businessplan for deep context.
 *
 * Everything that previously lived here (project brief, economics,
 * partners, open questions) moved to its proper home:
 *   - Economics & funding & partners → /businessplan
 *   - Environmental / scientific / open-hardware → /wirkung
 *   - Project brief / approach / open questions → /businessplan
 *
 * Keeping this page lean is the design discipline we lost in the prior
 * iteration. If it grows again, split — don't stack.
 */

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
    items: { key: MilestoneKey; date: string; label: string }[]
  }
  nextLink: {
    eyebrow: string
    title: string
    body: string
    cta: string
  }
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
      <NextLink link={m.nextLink} />
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
          <div className="min-w-0">
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
              <li
                key={item.key}
                className="relative -ml-px flex gap-4 pb-8 pl-6 last:pb-0 sm:gap-6 sm:pl-8"
              >
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
                <div className="flex-1 min-w-0">
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

/* ─── Tail nudge ─────────────────────────────────────────────────
 * Status is a snapshot; the deep narrative (economics, market, risks,
 * partners) lives in /businessplan. This is the single outbound link
 * — exactly one place to go next.
 */

function NextLink({ link }: { link: StatusMessages['nextLink'] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Link
          href="/projects/upcycling/businessplan"
          className="group flex flex-col gap-3 rounded-lg border border-subtle bg-surface-base p-6 transition-colors hover:border-default sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex-1 min-w-0">
            <div className="ui-public-eyebrow">{link.eyebrow}</div>
            <p className="mt-2 text-lg font-semibold text-text-primary">{link.title}</p>
            <p className="mt-1 text-sm text-text-secondary">{link.body}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action transition-all group-hover:gap-2 shrink-0">
            {link.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  )
}
