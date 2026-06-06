/**
 * Presentation components for the workshop detail page.
 *
 * Each export is a small focused chunk of the page. page.tsx composes
 * them; this file holds the JSX so the orchestration stays readable.
 */

import { Link } from '@/i18n/navigation'
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, BookOpen } from 'lucide-react'
import { formatDateWithWeekday, formatTime } from '@/lib/date-formats'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatusBanner } from '@/components/ui/status-banner'
import { getLevelBadgeClass } from '@/config/workshops'
import Heading from '@/components/ui/Heading'
import type { getTranslations } from 'next-intl/server'
import type { WorkshopInstanceWithCount } from '@/components/workshops/types'
import type { WorkshopDetail } from './data'

type TFunc = Awaited<ReturnType<typeof getTranslations<'workshops'>>>

/* ────────────────────── Top header ────────────────────── */

export function WorkshopHeader({
  workshop, categoryName, t,
}: {
  workshop: WorkshopDetail
  categoryName: string | null
  t: TFunc
}) {
  return (
    <div className="bg-surface-base border-b border-subtle">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/workshops"
          className="inline-flex items-center text-text-secondary hover:text-text-primary mb-6 font-mono text-xs uppercase tracking-[0.18em]"
        >
          <ArrowLeft className="w-3 h-3 mr-2" />
          {t('detail.backToWorkshops')}
        </Link>

        <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-3">
          WORKSHOP{categoryName ? ` · ${categoryName}` : ''}
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          <Heading level={1} className="ui-public-display-md text-text-primary">
            {workshop.title}
          </Heading>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(workshop.level)}`}>
            {workshop.level || t('detail.allLevels')}
          </span>
        </div>
        {workshop.short_description && (
          <p className="ui-public-section-lede mt-4">{workshop.short_description}</p>
        )}
      </div>
    </div>
  )
}

/* ────────────────────── Details card ────────────────────── */

export function WorkshopDetailsCard({
  workshop, categoryName, t,
}: {
  workshop: WorkshopDetail
  categoryName: string | null
  t: TFunc
}) {
  const stats: Array<{ label: string; value: string }> = [
    { label: t('detail.duration'),        value: workshop.duration || t('detail.variableDuration') },
    { label: t('detail.maxParticipants'), value: String(workshop.max_participants) },
    { label: t('detail.category'),        value: categoryName || t('detail.generalCategory') },
    { label: t('detail.price'),           value: workshop.price_cents === 0
      ? t('detail.free')
      : t('detail.priceChf', { amount: Math.round(workshop.price_cents / 100) }) },
  ]

  return (
    <div className="card-shell p-6 sm:p-8">
      <div className="ui-public-eyebrow">{t('detail.details').toUpperCase()}</div>
      <Heading level={2} className="ui-public-display-md mt-3">{t('detail.details')}</Heading>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 border-t border-subtle pt-8">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">{s.label}</div>
            <div className="text-text-primary font-semibold mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      {workshop.description && (
        <p className="text-text-secondary mt-8">{workshop.description}</p>
      )}

      {workshop.target_audience && (
        <Section title={t('detail.targetAudience')}>
          <p className="text-text-secondary">{workshop.target_audience}</p>
        </Section>
      )}

      {workshop.prerequisites && (
        <Section title={t('detail.prerequisites')}>
          <p className="text-text-secondary">{workshop.prerequisites}</p>
        </Section>
      )}

      {workshop.learning_objectives && workshop.learning_objectives.length > 0 && (
        <Section title={t('detail.learningObjectives')}>
          <ul className="space-y-3">
            {workshop.learning_objectives.map((objective, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-action mr-3 mt-0.5 shrink-0" />
                <span className="text-text-secondary">{objective}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(workshop.materials_provided || workshop.materials_required) && (
        <Section title={t('detail.materials')}>
          {workshop.materials_provided && (
            <div className="mb-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-1">
                {t('detail.materialsProvided')}
              </p>
              <p className="text-text-secondary">{workshop.materials_provided}</p>
            </div>
          )}
          {workshop.materials_required && (
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-1">
                {t('detail.materialsRequired')}
              </p>
              <p className="text-text-secondary">{workshop.materials_required}</p>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-subtle pt-8">
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary mb-3">{title}</div>
      {children}
    </div>
  )
}

/* ────────────────────── Upcoming instances list ────────────────────── */

export function WorkshopInstancesList({
  instances, fallbackMax, t,
}: {
  instances: WorkshopInstanceWithCount[]
  fallbackMax: number
  t: TFunc
}) {
  if (instances.length === 0) return null

  return (
    <div className="card-shell p-6 sm:p-8">
      <div className="ui-public-eyebrow">{t('detail.upcomingDates').toUpperCase()}</div>
      <Heading level={2} className="ui-public-display-md mt-3">{t('detail.upcomingDates')}</Heading>

      <div className="mt-8 space-y-4">
        {instances.map((instance) => {
          const maxParts = instance.max_participants ?? fallbackMax
          const spotsLeft = maxParts - instance.current_participants
          const isFull = spotsLeft <= 0
          const fillPct = Math.min(100, (instance.current_participants / Math.max(maxParts, 1)) * 100)

          return (
            <div key={instance.id} className="border rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="font-mono tabular-nums text-sm text-text-primary flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    {formatDateWithWeekday(instance.start_date)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <Clock className="w-4 h-4 text-text-muted" />
                    {formatTime(instance.start_date)}
                  </span>
                </div>

                {isFull ? (
                  <StatusBadge variant="error">{t('detail.soldOut')}</StatusBadge>
                ) : (
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary flex items-center gap-3">
                    <span>{t('detail.registrationCount', { current: instance.current_participants, max: maxParts })}</span>
                    <span className="w-24 bg-surface-overlay rounded-full h-1.5 overflow-hidden">
                      <span
                        className="block bg-text-primary h-full"
                        style={{ width: `${fillPct}%` }}
                      />
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  {instance.location || t('detail.locationTba')}
                </span>
                {instance.instructor && (
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {t('detail.instructor', { name: instance.instructor })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────── Sidebar stats ────────────────────── */

export function WorkshopStatsCard({
  workshop, categoryName, upcomingCount, t,
}: {
  workshop: WorkshopDetail
  categoryName: string | null
  upcomingCount: number
  t: TFunc
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: t('detail.category'),        value: categoryName || t('detail.generalCategory') },
    { label: t('detail.level'),           value: workshop.level || t('detail.allLevels') },
    { label: t('detail.duration'),        value: workshop.duration || t('detail.variableDuration') },
    { label: t('detail.maxParticipants'), value: String(workshop.max_participants) },
  ]
  if (upcomingCount > 0) {
    rows.push({ label: t('detail.dates'), value: t('detail.datesAvailable', { count: upcomingCount }) })
  }

  return (
    <div className="card-shell p-6">
      <div className="ui-public-eyebrow">{t('detail.stats').toUpperCase()}</div>
      <Heading level={3} className="font-semibold text-text-primary mt-3 mb-4">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-text-muted" />{t('detail.stats')}
        </span>
      </Heading>

      <dl className="space-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <dt className="text-text-secondary">{r.label}</dt>
            <dd className="font-medium text-text-primary text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function NoUpcomingDatesNotice({ t }: { t: TFunc }) {
  return (
    <div className="card-shell p-6">
      <div className="ui-public-eyebrow">{t('detail.registration').toUpperCase()}</div>
      <Heading level={3} className="font-semibold text-text-primary mt-3 mb-4">{t('detail.registration')}</Heading>
      <StatusBanner variant="warning">{t('detail.noDates')}</StatusBanner>
    </div>
  )
}
