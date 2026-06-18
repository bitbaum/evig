import {
  ListChecks,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpcyclingPageHeader } from '../UpcyclingPageHeader'
import { DOSSIER_GROUPS, DOSSIER_PROJECT } from '@/data/upcycling-dossier'
import { DossierContacts } from './DossierContacts'
import { lockDossier } from './actions'

/**
 * Geschützte Dossier-Ansicht. Reine Render-Schicht über der Daten-SSOT
 * `@/data/upcycling-dossier`. Wird nur gerendert, wenn das Zugangscookie
 * gültig ist (Prüfung in page.tsx).
 */
export function DossierView() {
  const p = DOSSIER_PROJECT
  const snapshotLabel = formatSnapshot(p.snapshotIso)

  return (
    <article className="bg-canvas">
      <UpcyclingPageHeader
        eyebrow="Intern · Vertraulich"
        title="Projektdossier"
        intro={p.summary}
        belowIntro={
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <time
              dateTime={p.snapshotIso}
              className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
            >
              Stand {snapshotLabel}
            </time>
            <form action={lockDossier}>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="h-auto gap-1.5 rounded-full border border-subtle bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-action/40 hover:bg-surface-raised hover:text-text-primary"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Sperren
              </Button>
            </form>
          </div>
        }
      />

      {/* Hauptinhalt: die actionable Kontaktdatenbank */}
      <DossierContacts groups={DOSSIER_GROUPS} />

      {/* Projektbrief */}
      <ListSection
        icon={ListChecks}
        title="Aufgaben"
        intro="Wichtigste offene Arbeitspakete der laufenden Projektphase."
        ordered
        items={p.tasks}
      />

      <ListSection
        icon={HelpCircle}
        title="Offene Fragen"
        intro="Zu klärende Punkte für Produktentscheid, Ökobilanz und Markteinführung."
        items={p.openQuestions}
      />

      <Timeline items={p.timeline} />

      <ListSection
        icon={Lightbulb}
        title="Empfehlungen"
        intro="Priorisierung für den erfolgreichen Abschluss der Projektphase."
        items={[...p.recommendations]}
        tone="raised"
      />

      <SourceNote />
    </article>
  )
}

/* ─── Listen-Sektion (Aufgaben / Fragen / Empfehlungen) ───────────── */

function ListSection({
  icon: Icon,
  title,
  intro,
  items,
  ordered,
  tone = 'canvas',
}: {
  icon: typeof ListChecks
  title: string
  intro: string
  items: readonly string[]
  ordered?: boolean
  tone?: 'canvas' | 'raised'
}) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <section className={tone === 'raised' ? 'border-b border-subtle bg-surface-raised' : 'border-b border-subtle bg-canvas'}>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-surface-base text-action">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="ui-public-display-md">{title}</h2>
        </div>
        <p className="ui-public-section-lede mt-4 max-w-3xl">{intro}</p>

        <List className="mt-8 max-w-3xl space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-text-secondary">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-text-tertiary tabular-nums">
                {ordered ? `${String(i + 1).padStart(2, '0')}` : '—'}
              </span>
              <span className="text-sm sm:text-base">{item}</span>
            </li>
          ))}
        </List>
      </div>
    </section>
  )
}

/* ─── Zeitplan ────────────────────────────────────────────────────── */

function Timeline({ items }: { items: typeof DOSSIER_PROJECT.timeline }) {
  return (
    <section className="border-b border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-surface-base text-action">
            <FileText className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h2 className="ui-public-display-md">Zeitplan & Fristen</h2>
        </div>
        <p className="ui-public-section-lede mt-4 max-w-3xl">
          Meilensteine bis zur Präsentation vor dem Swico Innovationsfonds.
        </p>

        <ol className="mt-10 space-y-0 border-l border-subtle">
          {items.map((item, i) => {
            const Icon = item.done ? CheckCircle2 : Circle
            return (
              <li key={i} className="relative -ml-px flex gap-4 pb-8 pl-6 last:pb-0 sm:gap-6 sm:pl-8">
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-canvas ${
                    item.done ? 'text-action' : 'text-text-tertiary'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {item.date}
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

function SourceNote() {
  return (
    <section className="bg-surface-raised">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs text-text-tertiary">
          Quelle: interne Projektunterlagen (Projektinfo & Kontaktdetails),
          übergeben an Andreas. Kontaktangaben sind öffentlich verifizierbare
          Geschäftsadressen. Vertraulich behandeln und nicht öffentlich teilen.
        </p>
      </div>
    </section>
  )
}

/* ─── Helfer ──────────────────────────────────────────────────────── */

function formatSnapshot(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  return `${d}. ${MONTHS[(m ?? 1) - 1]} ${y}`
}
