'use client'

import ReactMarkdown from 'react-markdown'
import { Link } from '@/i18n/navigation'
import { MapPin, Clock, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  getRoleTrackLabel,
  vacancyAcceptsApplications,
  VACANCY_STATUS,
  type RoleTrack,
  type VacancyStatus,
} from '@/config/hr-vacancies'
import { ROUTES } from '@/config/routes'
import { CareerApplyForm } from '@/components/careers/CareerApplyForm'

export interface PublicVacancyDetail {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string
  role_track: string
  department: string | null
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  start_date: string | null
  application_deadline: string | null
  compensation_public_text: string | null
  status: string
}

export default function CareerDetailClient({ posting }: { posting: PublicVacancyDetail }) {
  const status = posting.status as VacancyStatus
  const accepts = vacancyAcceptsApplications(status)
  const paused = status === VACANCY_STATUS.FROZEN
  const filled = status === VACANCY_STATUS.FILLED

  return (
    <div className="space-y-10">
      <Link href={ROUTES.public.careers} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="w-4 h-4" />
        Alle Stellen
      </Link>

      <div>
        <p className="text-sm font-medium text-primary-700">{getRoleTrackLabel(posting.role_track)}</p>
        <h1 className="ui-public-display-lg mt-2">{posting.title}</h1>
        {posting.summary && (
          <p className="ui-public-section-lede mt-4">{posting.summary}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-muted">
          {(posting.location || posting.remote_ok) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {posting.remote_ok ? 'Remote möglich' : posting.location}
            </span>
          )}
          {posting.hours_per_week && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {posting.hours_per_week} h/Woche
            </span>
          )}
        </div>

        {(paused || filled) && (
          <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            {filled ? 'Diese Stelle ist besetzt.' : 'Bewerbungen sind vorübergehend pausiert.'}
          </div>
        )}

        {posting.compensation_public_text && (
          <p className="mt-4 text-sm text-text-secondary">
            <span className="font-medium">Vergütung:</span> {posting.compensation_public_text}
          </p>
        )}
      </div>

      <Card className="p-6 prose prose-neutral max-w-none dark:prose-invert">
        <ReactMarkdown>{posting.description}</ReactMarkdown>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Jetzt bewerben</h2>
        <CareerApplyForm
          slug={posting.slug}
          roleTrack={posting.role_track as RoleTrack}
          acceptsApplications={accepts}
        />
      </Card>
    </div>
  )
}
