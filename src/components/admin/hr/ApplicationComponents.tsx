'use client'

import {
  APPLICATION_STATUS_OPTIONS,
  APPLICATION_STATUS_LABELS,
  getApplicationStatusBadge,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import { getRoleTrackLabel } from '@/config/hr-vacancies'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ApplicationListItem } from './types'
import { ChevronDown, ChevronUp, UserCheck, XCircle, ArrowRight } from 'lucide-react'

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
        {APPLICATION_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABELS[s]}
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
  const badge = getApplicationStatusBadge(application.status)
  const busy = actionLoading === application.id
  const canHire = ['new', 'screening', 'interview', 'offer'].includes(application.status)
  const canAdvance = !['hired', 'rejected', 'withdrawn'].includes(application.status)

  return (
    <div className="bg-surface-base rounded-lg border border overflow-hidden">
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
            <p className="text-sm text-text-muted mt-1">Stelle: {application.posting_title}</p>
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
        <div className="border-t border px-4 sm:px-5 py-4 space-y-4">
          {application.applicant_phone && (
            <p className="text-sm"><span className="text-text-muted">Telefon:</span> {application.applicant_phone}</p>
          )}
          <p className="text-sm"><span className="text-text-muted">Quelle:</span> {application.source}</p>
          {application.admin_notes && (
            <p className="text-sm whitespace-pre-wrap"><span className="text-text-muted">Notizen:</span> {application.admin_notes}</p>
          )}
          {application.rejection_reason && (
            <p className="text-sm text-error-700"><span className="font-medium">Ablehnung:</span> {application.rejection_reason}</p>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-text-muted">Track-Antworten anzeigen</summary>
            <pre className="mt-2 p-3 bg-surface-raised rounded-lg overflow-auto text-xs">
              {JSON.stringify(application.track_responses, null, 2)}
            </pre>
          </details>

          <div className="flex flex-wrap gap-2">
            {canAdvance && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={onAdvance}>
                <ArrowRight className="w-4 h-4" />
                Nächste Stufe
              </Button>
            )}
            {canHire && (
              <Button size="sm" variant="primary" disabled={busy} onClick={onHire}>
                <UserCheck className="w-4 h-4" />
                Einstellen
              </Button>
            )}
            {!['hired', 'rejected', 'withdrawn'].includes(application.status) && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={onReject}>
                <XCircle className="w-4 h-4" />
                Ablehnen
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
  onChange: (patch: Partial<{ rejectionReason: string; adminNotes: string }>) => void
  onSubmit: () => void
  onClose: () => void
}

export function ApplicationActionDialog({ dialog, onChange, onSubmit, onClose }: DialogProps) {
  const title =
    dialog.type === 'hire'
      ? 'Person einstellen?'
      : dialog.type === 'reject'
        ? 'Bewerbung ablehnen'
        : 'Status weiterleiten'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface-base rounded-xl border border max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {dialog.type === 'advance' && dialog.targetStatus && (
          <p className="text-sm text-text-secondary">
            Neuer Status: {APPLICATION_STATUS_LABELS[dialog.targetStatus]}
          </p>
        )}
        {dialog.type === 'hire' && (
          <p className="text-sm text-text-secondary">
            Es wird ein Team-Profil erstellt, Onboarding-Aufgaben angelegt und die Stelle als besetzt markiert.
          </p>
        )}
        {dialog.type === 'reject' && (
          <div>
            <label className="text-sm font-medium">Grund *</label>
            <Textarea
              className="mt-1"
              rows={3}
              value={dialog.rejectionReason}
              onChange={(e) => onChange({ rejectionReason: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Interne Notiz (optional)</label>
          <Textarea
            className="mt-1"
            rows={2}
            value={dialog.adminNotes}
            onChange={(e) => onChange({ adminNotes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={onSubmit}>
            {dialog.type === 'hire' ? 'Einstellen' : 'Bestätigen'}
          </Button>
        </div>
      </div>
    </div>
  )
}
