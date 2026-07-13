'use client'

import { Link } from '@/i18n/navigation'
import { Briefcase, MapPin, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  getRoleTrackLabel,
  getVacancyStatusLabel,
  vacancyAcceptsApplications,
  VACANCY_STATUS,
  type RoleTrack,
  type VacancyStatus,
} from '@/config/hr-vacancies'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export interface PublicVacancyItem {
  id: string
  slug: string
  title: string
  summary: string | null
  role_track: string
  department: string | null
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  status: string
  application_deadline: string | null
}

interface Props {
  postings: PublicVacancyItem[]
  activeTrack: string | null
}

const TRACK_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: 'volunteer', label: 'Freiwilligenarbeit' },
  { value: 'intern', label: 'Praktikum' },
  { value: 'employee', label: 'Anstellung' },
  { value: 'reintegration', label: 'Wiedereinstieg' },
  { value: 'contractor', label: 'Auftrag' },
]

export default function CareersListClient({ postings, activeTrack }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {TRACK_FILTERS.map((f) => {
          const href = f.value ? `${ROUTES.public.careers}?track=${f.value}` : ROUTES.public.careers
          const active = (activeTrack ?? '') === f.value
          return (
            <Link
              key={f.value || 'all'}
              href={href}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm border transition-colors',
                active
                  ? 'bg-action text-action-text border-action'
                  : 'border-neutral-200 hover:border-neutral-300',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {postings.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aktuell keine offenen Stellen in dieser Kategorie.</p>
          <Link href="/get-involved/kontakt" className="text-primary-600 underline text-sm mt-2 inline-block">
            Initiativbewerbung senden
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {postings.map((p) => {
            const status = p.status as VacancyStatus
            const paused = status === VACANCY_STATUS.FROZEN
            const filled = status === VACANCY_STATUS.FILLED
            return (
              <Card key={p.id} className="p-5 hover:border-neutral-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-action bg-action-muted px-2 py-0.5 rounded-full">
                        {getRoleTrackLabel(p.role_track)}
                      </span>
                      {paused && (
                        <span className="text-xs text-warning-800 bg-warning-100 px-2 py-0.5 rounded-full">
                          Bewerbung pausiert
                        </span>
                      )}
                      {filled && (
                        <span className="text-xs text-info-800 bg-info-100 px-2 py-0.5 rounded-full">
                          {getVacancyStatusLabel(status)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={ROUTES.public.careerPosting(p.slug)}
                      className="text-lg font-semibold text-text-primary hover:text-primary-600"
                    >
                      {p.title}
                    </Link>
                    {p.summary && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{p.summary}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-muted">
                      {(p.location || p.remote_ok) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {p.remote_ok ? 'Remote möglich' : p.location}
                        </span>
                      )}
                      {p.hours_per_week && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {p.hours_per_week} h/Woche
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={ROUTES.public.careerPosting(p.slug)}
                    className="ui-public-cta shrink-0 text-sm"
                  >
                    {vacancyAcceptsApplications(status) ? 'Bewerben' : 'Details'}
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
