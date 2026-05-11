'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatPriceCents } from '@/config/marketplace'
import {
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_LABELS,
  WORKSHOP_CATEGORIES,
  type ProposalStatus,
} from '@/config/workshops'
import type { WorkshopProposalWithProposer } from '@/components/workshops/types'
import Heading from '@/components/admin/AdminHeading'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { useAdminWorkshops } from '@/hooks/useAdminWorkshops'

// ─── Status config ─────────────────────────────────────────────────────────

const PROPOSAL_STATUS_CONFIG: Record<string, { icon: React.ReactNode }> = {
  [PROPOSAL_STATUS.APPROVED]: { icon: <CheckCircle className="w-5 h-5 text-primary-600" /> },
  [PROPOSAL_STATUS.PENDING]: { icon: <Clock className="w-5 h-5 text-warning-600" /> },
  [PROPOSAL_STATUS.REJECTED]: { icon: <XCircle className="w-5 h-5 text-error-600" /> },
  [PROPOSAL_STATUS.REQUIRES_CHANGES]: { icon: <AlertCircle className="w-5 h-5 text-orange-600" /> },
}

const DEFAULT_STATUS_ICON = <AlertCircle className="w-5 h-5 text-neutral-400" />

const STRINGS = {
  APPROVE_CONFIRM: 'Möchtest du diesen Workshop-Vorschlag wirklich genehmigen?',
  EMPTY_SEARCH: (term: string) => `Keine Vorschläge für "${term}" gefunden.`,
  EMPTY_PENDING: 'Keine ausstehenden Vorschläge vorhanden.',
  EMPTY_STATUS: (s: string) => `Keine Vorschläge mit Status "${s}" gefunden.`,
} as const

function getLocationText(proposal: WorkshopProposalWithProposer): string {
  switch (proposal.location_type) {
    case 'venue': return proposal.selected_location_name || proposal.proposed_location || 'Veranstaltungsort'
    case 'home': return proposal.proposed_location || 'Zu Hause'
    case 'online': return 'Online'
    default: return 'Unbekannt'
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AdminWorkshopsPage() {
  const router = useRouter()
  const {
    proposals, totalItems, totalPages, loading, error,
    filters, searchTerm, currentPage, pageSize,
    rejectingId, rejectionReason, rejectError,
    approveConfirmId, approveLoading, rejectLoading, sessionStatus,
    setSearchTerm, setFilters, setCurrentPage, setRejectionReason,
    handleApprove, doApprove, handleReject, openRejectForm, cancelReject, setApproveConfirmId,
  } = useAdminWorkshops()

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  return (
    <AdminPageWrapper
      title="Workshop-Verwaltung"
      description="Genehmige und verwalte Workshop-Vorschläge"
      icon={GraduationCap}
      iconColor="blue"
      actions={
        <Link
          href="/admin/workshops/instances"
          className="inline-flex items-center px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Termine verwalten
        </Link>
      }
      backButton={{ href: '/admin', label: 'Zurück zum Dashboard' }}
    >
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Titel suchen..."
        dropdowns={[
          {
            key: 'status',
            label: 'Status',
            value: filters.status,
            onChange: (value) => setFilters(prev => ({ ...prev, status: value as ProposalStatus | 'all' })),
            options: [
              { value: PROPOSAL_STATUS.PENDING, label: PROPOSAL_STATUS_LABELS[PROPOSAL_STATUS.PENDING] },
              { value: PROPOSAL_STATUS.APPROVED, label: PROPOSAL_STATUS_LABELS[PROPOSAL_STATUS.APPROVED] },
              { value: PROPOSAL_STATUS.REJECTED, label: PROPOSAL_STATUS_LABELS[PROPOSAL_STATUS.REJECTED] },
              { value: PROPOSAL_STATUS.REQUIRES_CHANGES, label: PROPOSAL_STATUS_LABELS[PROPOSAL_STATUS.REQUIRES_CHANGES] },
            ],
          },
          {
            key: 'category',
            label: 'Kategorie',
            value: filters.category,
            onChange: (value) => setFilters(prev => ({ ...prev, category: value })),
            options: WORKSHOP_CATEGORIES.map(cat => ({ value: cat.name, label: cat.name })),
            allLabel: 'Alle Kategorien',
          },
        ]}
      />

      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-error-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Heading level={2} className="text-lg font-semibold text-neutral-900">
            Workshop-Vorschläge ({proposals.length})
          </Heading>
        </div>

        <div className="divide-y divide-neutral-200">
          {proposals.map((proposal) => {
            const statusIcon = PROPOSAL_STATUS_CONFIG[proposal.status]?.icon ?? DEFAULT_STATUS_ICON
            const statusLabel = PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status

            return (
              <div key={proposal.id} className="p-6 hover:bg-neutral-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <GraduationCap className="w-5 h-5 text-info-600" />
                      <Heading level={3} className="text-lg font-semibold text-neutral-900 truncate">
                        {proposal.title}
                      </Heading>
                      {statusIcon}
                      <span className="text-sm text-neutral-600">{statusLabel}</span>
                      {proposal.last_edited_at && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-info-100 text-info-800 rounded">
                          Von Admin bearbeitet
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {proposal.category}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> Max. {proposal.max_participants} Teilnehmer
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(proposal.duration_minutes / 60)}h {proposal.duration_minutes % 60}min
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> {formatPriceCents(proposal.price_cents)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {getLocationText(proposal)}
                      </div>
                    </div>

                    <div className="text-sm text-neutral-500">
                      Vorgeschlagen von {proposal.proposer_name} ({proposal.proposer_email}) •{' '}
                      {formatDateShort(proposal.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                    <Link
                      href={`/admin/workshops/proposals/${proposal.id}`}
                      className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Details
                    </Link>

                    {proposal.status === PROPOSAL_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleApprove(proposal.id)}
                          disabled={approveLoading}
                          className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approveLoading ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Genehmigen
                        </button>
                        <button
                          onClick={() => openRejectForm(proposal.id)}
                          className="inline-flex items-center px-3 py-2 bg-error-600 text-white rounded-lg text-sm font-medium hover:bg-error-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Ablehnen
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {rejectingId === proposal.id && (
                  <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-lg">
                    <label className="block text-sm font-medium text-error-800 mb-2">
                      Ablehnungsgrund:
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Bitte gib einen Ablehnungsgrund an..."
                      rows={3}
                      className="w-full px-3 py-2 border border-error-300 rounded-lg focus:ring-2 focus:ring-error-500 text-sm"
                      autoFocus
                    />
                    {rejectError && <p className="mt-1 text-sm text-error-700">{rejectError}</p>}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReject(proposal.id)}
                        disabled={rejectLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error-600 text-white rounded-lg text-sm font-medium hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rejectLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Ablehnung bestätigen
                      </button>
                      <button
                        onClick={cancelReject}
                        className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {proposals.length === 0 && (
            <div className="px-6 py-12 text-center">
              <GraduationCap className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">
                Keine Workshop-Vorschläge gefunden
              </Heading>
              <p className="text-neutral-600 mb-4">
                {searchTerm.trim()
                  ? STRINGS.EMPTY_SEARCH(searchTerm)
                  : filters.status === PROPOSAL_STATUS.PENDING
                  ? STRINGS.EMPTY_PENDING
                  : STRINGS.EMPTY_STATUS(filters.status)}
              </p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmDialog
        isOpen={!!approveConfirmId}
        title="Workshop genehmigen"
        message={STRINGS.APPROVE_CONFIRM}
        confirmLabel="Genehmigen"
        cancelLabel="Abbrechen"
        variant="success"
        isLoading={approveLoading}
        onConfirm={doApprove}
        onClose={() => setApproveConfirmId(null)}
      />
    </AdminPageWrapper>
  )
}
