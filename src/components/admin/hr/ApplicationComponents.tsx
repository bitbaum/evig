'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  APPLICATION_STATUS_LABELS,
  getApplicationStatusBadge,
  isHireableApplicationStatus,
  isTerminalApplicationStatus,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import { getApplicationSourceLabel } from '@/config/hr-vacancies'
import { getRoleTrackLabel } from '@/config/hr-vacancies'
import { ROUTES } from '@/config/routes'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { ApplicationListItem } from './types'
import { ChevronDown, ChevronUp, UserCheck, XCircle, ArrowRight, ExternalLink } from 'lucide-react'

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 30) return `vor ${days} Tagen`
  return date.toLocaleDateString('de-CH')
}

interface FilterProps {
  statusFilter: ApplicationStatus | 'all'
  searchQuery: string
  onStatusChange: (value: ApplicationStatus | 'all') => void
  onSearchChange: (value: string) => void
}

export function ApplicationFilters({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: FilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as ApplicationStatus | 'all')}
        className="sm:w-48"
      >
        <option value="all">Alle Status</option>
        {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        type="search"
        placeholder="Name oder E-Mail…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />
    </div>
  )
}

interface CardProps {
  application: ApplicationListItem
  expanded: boolean
  actionLoading: string | null
  onToggle: () => void
  onAdvance: () => void
  onReject: () => void
  onHire: () => void
}

export function ApplicationCard({
  application,
  expanded,
  actionLoading,
  onToggle,
  onAdvance,
  onReject,
  onHire,
}: CardProps) {
  const t = useTranslations('admin.hr.applications')
  const badge = getApplicationStatusBadge(application.status)
  const busy = actionLoading === application.id
  const canHire = isHireableApplicationStatus(application.status)
  const canAdvance = !isTerminalApplicationStatus(application.status)

  return (
    <div className="bg-surface-base rounded-lg border border-subtle overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        className="w-full h-auto text-left p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-surface-raised justify-start"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', badge.bg, badge.color)}>
              {badge.label}
            </span>
            {application.role_track && (
              <span className="text-xs text-text-muted">{getRoleTrackLabel(application.role_track)}</span>
            )}
          </div>
          <p className="font-semibold text-text-primary">{application.applicant_name}</p>
          <p className="text-sm text-text-secondary">{application.applicant_email}</p>
          {application.posting_title && (
            <p className="text-sm text-text-muted mt-1">{t('postingLabel')}: {application.posting_title}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          <span className="text-xs text-text-muted">
            {formatRelativeDate(application.created_at)}
          </span>
        </div>
      </Button>

      {expanded && (
        <div className="border-t border-subtle px-4 sm:px-5 py-4 space-y-4">
          {application.hired_team_profile_id && (
            <Link
              href={`${ROUTES.admin.team}/${application.hired_team_profile_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {t('openTeamProfile')}
            </Link>
          )}

          {application.applicant_phone && (
            <p className="text-sm"><span className="text-text-muted">{t('phone')}:</span> {application.applicant_phone}</p>
          )}
          <p className="text-sm">
            <span className="text-text-muted">{t('source')}:</span>{' '}
            {getApplicationSourceLabel(application.source)}
          </p>
          {application.admin_notes && (
            <p className="text-sm whitespace-pre-wrap"><span className="text-text-muted">{t('notes')}:</span> {application.admin_notes}</p>
          )}
          {application.rejection_reason && (
            <p className="text-sm text-error-700"><span className="font-medium">{t('rejection')}:</span> {application.rejection_reason}</p>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-text-muted">{t('trackResponses')}</summary>
            <pre className="mt-2 p-3 bg-surface-raised rounded-lg overflow-auto text-xs">
              {JSON.stringify(application.track_responses, null, 2)}
            </pre>
          </details>

          <div className="flex flex-wrap gap-2">
            {canAdvance && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={onAdvance}>
                <ArrowRight className="w-4 h-4" />
                {t('advance')}
              </Button>
            )}
            {canHire && (
              <Button size="sm" variant="primary" disabled={busy} onClick={onHire}>
                <UserCheck className="w-4 h-4" />
                {t('hire')}
              </Button>
            )}
            {!isTerminalApplicationStatus(application.status) && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={onReject}>
                <XCircle className="w-4 h-4" />
                {t('reject')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DialogProps {
  dialog: {
    type: 'advance' | 'reject' | 'hire'
    targetStatus?: ApplicationStatus
    rejectionReason: string
    adminNotes: string
  }
  isLoading?: boolean
  onChange: (patch: Partial<{ rejectionReason: string; adminNotes: string }>) => void
  onSubmit: () => void
  onClose: () => void
}

export function ApplicationActionDialog({
  dialog,
  isLoading,
  onChange,
  onSubmit,
  onClose,
}: DialogProps) {
  const t = useTranslations('admin.hr.applications')

  const title =
    dialog.type === 'hire'
      ? t('dialog.hireTitle')
      : dialog.type === 'reject'
        ? t('dialog.rejectTitle')
        : t('dialog.advanceTitle')

  const message =
    dialog.type === 'hire'
      ? t('dialog.hireMessage')
      : dialog.type === 'reject'
        ? t('dialog.rejectMessage')
        : dialog.targetStatus
          ? t('dialog.advanceMessage', { status: APPLICATION_STATUS_LABELS[dialog.targetStatus] })
          : ''

  const details = (
    <div className="space-y-3">
      {dialog.type === 'reject' && (
        <div>
          <label className="text-sm font-medium">{t('dialog.rejectionReason')}</label>
          <Textarea
            className="mt-1"
            rows={3}
            value={dialog.rejectionReason}
            onChange={(e) => onChange({ rejectionReason: e.target.value })}
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">{t('dialog.adminNotes')}</label>
        <Textarea
          className="mt-1"
          rows={2}
          value={dialog.adminNotes}
          onChange={(e) => onChange({ adminNotes: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <ConfirmDialog
      isOpen
      title={title}
      message={message}
      details={details}
      confirmLabel={
        dialog.type === 'hire' ? t('hire') : t('dialog.confirm')
      }
      cancelLabel={t('dialog.cancel')}
      isLoading={isLoading}
      variant={dialog.type === 'reject' ? 'danger' : dialog.type === 'hire' ? 'success' : 'default'}
      onConfirm={onSubmit}
      onClose={onClose}
    />
  )
}
