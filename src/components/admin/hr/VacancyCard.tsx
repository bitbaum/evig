'use client'

import Link from 'next/link'
import {
  Copy,
  Share2,
  Pause,
  Play,
  CheckCircle2,
  Files,
  Pencil,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import {
  VACANCY_STATUS,
  VACANCY_STATUS_COLORS,
  getRoleTrackLabel,
  getVacancyStatusLabel,
  type VacancyStatus,
} from '@/config/hr-vacancies'
import { getDepartmentLabel } from '@/config/team'
import { cn } from '@/lib/utils'
import type { VacancyListItem } from './types'

interface Props {
  vacancy: VacancyListItem
  actionLoading: string | null
  onTransition: (id: string, status: VacancyStatus) => void
  onDuplicate: (id: string) => void
  onCopyLink: (slug: string) => void
  onShare: (title: string, slug: string) => void
}

export function VacancyCard({
  vacancy,
  actionLoading,
  onTransition,
  onDuplicate,
  onCopyLink,
  onShare,
}: Props) {
  const busy = actionLoading === vacancy.id
  const status = vacancy.status as VacancyStatus
  const applicationCount = vacancy.application_count ?? 0

  return (
    <div className="bg-surface-base rounded-lg border border-subtle p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                VACANCY_STATUS_COLORS[status],
              )}
            >
              {getVacancyStatusLabel(status)}
            </span>
            <span className="text-xs text-text-muted">{getRoleTrackLabel(vacancy.role_track)}</span>
            {vacancy.department && (
              <span className="text-xs text-text-muted">{getDepartmentLabel(vacancy.department)}</span>
            )}
          </div>
          <Link
            href={ROUTES.admin.hrVacancy(vacancy.id)}
            className="text-lg font-semibold text-text-primary hover:text-primary-600"
          >
            {vacancy.title}
          </Link>
          {vacancy.summary && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{vacancy.summary}</p>
          )}
        </div>
        {applicationCount > 0 ? (
          <Link
            href={ROUTES.admin.hrApplicationsForPosting(vacancy.id)}
            className="flex items-center gap-2 text-sm text-action hover:underline shrink-0"
          >
            <Users className="w-4 h-4" />
            {applicationCount} Bewerbungen
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-muted shrink-0">
            <Users className="w-4 h-4" />
            0 Bewerbungen
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {status === VACANCY_STATUS.DRAFT && (
          <Button
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => onTransition(vacancy.id, VACANCY_STATUS.PUBLISHED)}
          >
            <Play className="w-4 h-4" />
            Veröffentlichen
          </Button>
        )}
        {status === VACANCY_STATUS.PUBLISHED && (
          <>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onTransition(vacancy.id, VACANCY_STATUS.FROZEN)}
            >
              <Pause className="w-4 h-4" />
              Pausieren
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onTransition(vacancy.id, VACANCY_STATUS.FILLED)}
            >
              <CheckCircle2 className="w-4 h-4" />
              Als besetzt markieren
            </Button>
          </>
        )}
        {status === VACANCY_STATUS.FROZEN && (
          <Button
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => onTransition(vacancy.id, VACANCY_STATUS.PUBLISHED)}
          >
            <Play className="w-4 h-4" />
            Wieder öffnen
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCopyLink(vacancy.slug)}>
          <Copy className="w-4 h-4" />
          Link kopieren
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onShare(vacancy.title, vacancy.slug)}>
          <Share2 className="w-4 h-4" />
          Teilen
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDuplicate(vacancy.id)}>
          <Files className="w-4 h-4" />
          Duplizieren
        </Button>
        <Link href={ROUTES.admin.hrVacancy(vacancy.id)}>
          <Button size="sm" variant="ghost">
            <Pencil className="w-4 h-4" />
            Bearbeiten
          </Button>
        </Link>
      </div>
    </div>
  )
}
