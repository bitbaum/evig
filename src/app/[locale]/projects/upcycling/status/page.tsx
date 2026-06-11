import { getTranslations } from 'next-intl/server'
import { ArrowRight, CheckCircle2, CircleDot, Circle, Clock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  UPCYCLING_STATUS,
  type MilestoneKey,
  type MilestoneStatus,
} from '@/data/upcycling-status'
import { cn } from '@/lib/utils'

/** Rebuild every hour so the deadline countdown stays within 1 day of accurate.
 *  The rest of the page is otherwise static-data-driven. */
export const revalidate = 3600

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
  /** ICU-format strings for the next-deadline countdown chip. The same
   *  countdown serves any milestone with an ISO date; the milestone-specific
   *  label is interpolated via `{milestone}`. */
  countdown: {
    daysLeft: string    // "{days, plural, one {Noch # Tag} other {Noch # Tage}} bis {milestone}"
    today: string       // "Heute fällig: {milestone}"
    overdue: string     // "{days, plural, one {# Tag} other {# Tage}} überfällig: {milestone}"
  }
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

  // Find the next dated milestone — drives the header countdown chip.
  const nextDeadline = pickNextDeadline(status.milestoneDeadlines, m.timeline.items)

  return (
    <article className="bg-canvas">
      <Header
        eyebrow={m.eyebrow}
        title={m.title}
        intro={m.intro}
        snapshot={m.snapshot}
        snapshotIso={status.snapshotIso}
        countdown={m.countdown}
        nextDeadline={nextDeadline}
      />
      <Production section={m.production} numbers={status.production} />
      <Timeline section={m.timeline} statuses={status.milestoneStatuses} />
      <NextLink link={m.nextLink} />
    </article>
  )
}

/** Resolve which dated milestone to feature in the countdown chip.
 *  Picks the soonest deadline that hasn't yet passed by more than 14 days
 *  (so a freshly-met deadline still gets credit) and falls back to the
 *  soonest future deadline otherwise. Returns null when nothing is dated. */
function pickNextDeadline(
  deadlines: Record<MilestoneKey, string | null>,
  items: StatusMessages['timeline']['items'],
): { key: MilestoneKey; label: string; daysLeft: number; isoDate: string } | null {
  // UTC midnight today — independent of the server's local timezone so the
  // count is consistent across server restarts and CDN PoPs.
  const today = new Date()
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  const dated = Object.entries(deadlines)
    .filter(([, iso]) => !!iso)
    .map(([k, iso]) => {
      const [y, mo, d] = (iso as string).split('-').map(Number)
      const ms = Date.UTC(y, mo - 1, d)
      const daysLeft = Math.round((ms - todayMs) / 86_400_000)
      const label = items.find((it) => it.key === (k as MilestoneKey))?.label ?? k
      return { key: k as MilestoneKey, label, daysLeft, isoDate: iso as string }
    })
    // Prefer not-yet-overdue, but allow up to 14 days past as a grace
    // window so a milestone reads as "0 days" → "1 day overdue" → … and
    // doesn't immediately disappear after slipping. After 14 days overdue
    // the team should have updated the SSOT.
    .sort((a, b) => {
      const aHidden = a.daysLeft < -14
      const bHidden = b.daysLeft < -14
      if (aHidden !== bHidden) return aHidden ? 1 : -1
      return a.daysLeft - b.daysLeft
    })

  return dated[0] ?? null
}

/* ─── Header ─────────────────────────────────────────────────────── */

function Header({
  eyebrow,
  title,
  intro,
  snapshot,
  snapshotIso,
  countdown,
  nextDeadline,
}: {
  eyebrow: string
  title: string
  intro: string
  snapshot: StatusMessages['snapshot']
  snapshotIso: string
  countdown: StatusMessages['countdown']
  nextDeadline: { key: MilestoneKey; label: string; daysLeft: number; isoDate: string } | null
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
        {nextDeadline && (
          <DeadlineChip nextDeadline={nextDeadline} countdown={countdown} />
        )}
      </div>
    </header>
  )
}

/** Live deadline countdown for the soonest dated milestone. ICU plurals via
 *  next-intl mean each locale handles its own number-agreement rules. */
function DeadlineChip({
  nextDeadline,
  countdown,
}: {
  nextDeadline: { key: MilestoneKey; label: string; daysLeft: number; isoDate: string }
  countdown: StatusMessages['countdown']
}) {
  // Pick the ICU template based on past/present/future; next-intl renders
  // the plural form. We could use t() with formatting but the messages are
  // already shaped — interpolating directly keeps the chip server-renderable.
  const { daysLeft, label } = nextDeadline
  const abs = Math.abs(daysLeft)
  const template =
    daysLeft === 0 ? countdown.today
    : daysLeft > 0 ? countdown.daysLeft
    : countdown.overdue
  const message = template
    .replace('{milestone}', label)
    .replace(/\{days,\s*plural,([^}]*)\}/, (_match, body: string) => {
      // ICU-ish: {days, plural, one {Noch # Tag} other {Noch # Tage}}
      const one = body.match(/one\s*\{([^}]*)\}/)?.[1] ?? ''
      const other = body.match(/other\s*\{([^}]*)\}/)?.[1] ?? ''
      const chosen = abs === 1 ? one : other
      return chosen.replace(/#/g, String(abs))
    })
  const tone =
    daysLeft < 0 ? 'border-warning-300/60 bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300'
    : daysLeft <= 7 ? 'border-action/40 bg-action-muted/15 text-action'
    : 'border-subtle bg-surface-raised text-text-secondary'
  return (
    <div className="mt-6">
      <div className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium sm:text-sm',
        tone,
      )}>
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{message}</span>
        <time dateTime={nextDeadline.isoDate} className="hidden font-mono text-[10px] uppercase tracking-[0.18em] opacity-70 sm:inline">
          {nextDeadline.isoDate}
        </time>
      </div>
    </div>
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
