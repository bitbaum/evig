import { CheckCircle, XCircle, Clock, AlertCircle, Mail, Phone, ExternalLink, MapPin } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { APPROVAL_STATUS, getApprovalStatusBadge } from '@/config/approval-status'
import { getDocumentStatusBadge } from '@/config/document-status'
import { formatDateShort } from '@/lib/date-formats'
import type { RepairerApplication, ActionDialogState } from './types'

interface Props {
  application: RepairerApplication
  isPending: boolean
  actionLoading: string | null
  onOpenDialog: (type: ActionDialogState['type'], targetId: string) => void
}

function getStatusIcon(status: string) {
  switch (status) {
    case APPROVAL_STATUS.APPROVED: return <CheckCircle className="w-5 h-5 text-primary-500" />
    case APPROVAL_STATUS.REJECTED: return <XCircle className="w-5 h-5 text-error-500" />
    case APPROVAL_STATUS.REQUIRES_CHANGES: return <AlertCircle className="w-5 h-5 text-secondary-500" />
    default: return <Clock className="w-5 h-5 text-neutral-500" />
  }
}

function getStatusBadge(status: string) {
  const badge = getApprovalStatusBadge(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{badge.label}</span>
    </span>
  )
}

export function ApplicationCard({ application, isPending, actionLoading, onOpenDialog }: Props) {
  return (
    <div className="p-6 border-b border-neutral-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Heading level={3} className="text-lg text-neutral-900">
              {application.businessName || application.applicantName}
            </Heading>
            {getStatusBadge(application.status)}
            {(() => {
              const docBadge = getDocumentStatusBadge(application.documentVerificationStatus)
              return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${docBadge.bg} ${docBadge.color}`}>
                  Dokumente: {docBadge.label}
                </span>
              )
            })()}
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {application.applicantEmail}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {application.phone}
            </span>
            {application.website && (
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
            <span>Bewerbung vom {formatDateShort(application.createdAt)}</span>
            <span>{application.yearsExperience} Jahre Erfahrung</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {application.city} ({application.postalCode})
            </span>
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={() => onOpenDialog('request_changes', application.id)}
              disabled={actionLoading === application.id}
              className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 disabled:opacity-50 text-sm font-medium"
            >
              {actionLoading === application.id ? '...' : 'Änderungen anfordern'}
            </button>
            <button
              onClick={() => onOpenDialog('reject_app', application.id)}
              disabled={actionLoading === application.id}
              className="px-3 py-1.5 bg-error-100 text-error-700 rounded-lg hover:bg-error-200 disabled:opacity-50 text-sm font-medium"
            >
              {actionLoading === application.id ? '...' : 'Ablehnen'}
            </button>
            <Button
              onClick={() => onOpenDialog('approve_app', application.id)}
              disabled={actionLoading === application.id}
              variant="primary"
              size="sm"
            >
              {actionLoading === application.id ? '...' : 'Genehmigen'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
