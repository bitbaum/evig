'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { formatDateShort } from '@/lib/date-formats'
import {
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_LABELS,
  WORKSHOP_CATEGORIES,
  type ProposalStatus,
} from '@/config/workshops'
import type { WorkshopProposalWithProposer } from '@/components/workshops/types'
import Heading from '@/components/ui/Heading'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Pagination } from '@/components/ui/Pagination'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'

// ─── Status config ────────────────────────────────────────────────────────────

const PROPOSAL_STATUS_CONFIG: Record<string, { icon: React.ReactNode }> = {
  [PROPOSAL_STATUS.APPROVED]: {
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
  },
  [PROPOSAL_STATUS.PENDING]: {
    icon: <Clock className="w-5 h-5 text-yellow-600" />,
  },
  [PROPOSAL_STATUS.REJECTED]: {
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  [PROPOSAL_STATUS.REQUIRES_CHANGES]: {
    icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
  },
}

const DEFAULT_STATUS_ICON = <AlertCircle className="w-5 h-5 text-gray-400" />

// ─── Inline strings (can be moved to src/config/admin-content.ts later) ──────

const STRINGS = {
  APPROVE_CONFIRM: 'Möchtest du diesen Workshop-Vorschlag wirklich genehmigen?',
  APPROVE_ERROR: 'Fehler bei der Genehmigung',
  REJECT_ERROR: 'Fehler bei der Ablehnung',
  EMPTY_SEARCH: (term: string) => `Keine Vorschläge für "${term}" gefunden.`,
  EMPTY_PENDING: 'Keine ausstehenden Vorschläge vorhanden.',
  EMPTY_STATUS: (s: string) => `Keine Vorschläge mit Status "${s}" gefunden.`,
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

function getLocationText(proposal: WorkshopProposalWithProposer): string {
  switch (proposal.location_type) {
    case 'venue':
      return proposal.selected_location_name || proposal.proposed_location || 'Veranstaltungsort'
    case 'home':
      return proposal.proposed_location || 'Zu Hause'
    case 'online':
      return 'Online'
    default:
      return 'Unbekannt'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminWorkshopsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [proposals, setProposals] = useState<WorkshopProposalWithProposer[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{ status: ProposalStatus | 'all'; category: string }>({
    status: PROPOSAL_STATUS.PENDING,
    category: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadProposals = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    const params = new URLSearchParams({
      status: filters.status,
      limit: String(PAGE_SIZE),
      offset: String((currentPage - 1) * PAGE_SIZE),
    })
    if (filters.category !== 'all') params.set('category', filters.category)

    const result = await apiFetch<{ items: WorkshopProposalWithProposer[]; pagination?: { total: number } }>(
      `/api/admin/workshops/proposals?${params}`
    )
    if (signal?.aborted) return
    if (result.success && result.data) {
      setProposals(result.data.items || [])
      setTotalItems(result.data.pagination?.total || 0)
    } else {
      setError(result.error || ERROR_MESSAGES.WORKSHOP_PROPOSALS_LOAD_FAILED)
    }
    setLoading(false)
  }, [filters.status, filters.category, currentPage])

  useEffect(() => {
    if (status !== 'authenticated') return
    const controller = new AbortController()
    loadProposals(controller.signal)
    return () => controller.abort()
  }, [status, loadProposals])

  const handleApprove = async (proposalId: string) => {
    if (!confirm(STRINGS.APPROVE_CONFIRM)) return
    const result = await apiFetch<void>(`/api/admin/workshops/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: { action: 'approve', review_notes: 'Workshop genehmigt' },
    })
    if (result.success) {
      loadProposals()
    } else {
      setError(result.error || STRINGS.APPROVE_ERROR)
    }
  }

  const handleReject = async (proposalId: string) => {
    if (!rejectionReason.trim()) return
    const result = await apiFetch<void>(`/api/admin/workshops/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: { action: 'reject', review_notes: rejectionReason },
    })
    if (result.success) {
      setRejectingId(null)
      setRejectionReason('')
      loadProposals()
    } else {
      setError(result.error || STRINGS.REJECT_ERROR)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    router.push('/auth/login')
    return null
  }

  const filteredProposals = searchTerm.trim()
    ? proposals.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : proposals

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  return (
    <AdminPageWrapper
      title="Workshop-Verwaltung"
      description="Genehmige und verwalte Workshop-Vorschläge"
      icon={GraduationCap}
      iconColor="blue"
      actions={
        <Link
          href="/admin/workshops/instances"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Termine verwalten
        </Link>
      }
      backButton={{ href: '/admin', label: 'Zurück zum Dashboard' }}
    >
      {/* Filters */}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Proposals list */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <Heading level={2} className="text-lg font-semibold text-gray-900">
            Workshop-Vorschläge ({filteredProposals.length})
          </Heading>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredProposals.map((proposal) => {
            const statusIcon = PROPOSAL_STATUS_CONFIG[proposal.status]?.icon ?? DEFAULT_STATUS_ICON
            const statusLabel = PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status

            return (
              <div key={proposal.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <Heading level={3} className="text-lg font-semibold text-gray-900 truncate">
                        {proposal.title}
                      </Heading>
                      {statusIcon}
                      <span className="text-sm text-gray-600">{statusLabel}</span>
                      {proposal.last_edited_at && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Von Admin bearbeitet
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {proposal.category}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Max. {proposal.max_participants} Teilnehmer
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(proposal.duration_minutes / 60)}h {proposal.duration_minutes % 60}min
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        CHF {(proposal.price_cents / 100).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {getLocationText(proposal)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Vorgeschlagen von {proposal.proposer_name} ({proposal.proposer_email}) •{' '}
                      {formatDateShort(proposal.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/workshops/proposals/${proposal.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Link>

                    {proposal.status === PROPOSAL_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleApprove(proposal.id)}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Genehmigen
                        </button>
                        <button
                          onClick={() => { setRejectingId(proposal.id); setRejectionReason('') }}
                          className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ablehnen
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {rejectingId === proposal.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <label className="block text-sm font-medium text-red-800 mb-2">
                      Ablehnungsgrund:
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Bitte gib einen Ablehnungsgrund an..."
                      rows={3}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleReject(proposal.id)}
                        disabled={!rejectionReason.trim()}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Ablehnung bestätigen
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectionReason('') }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredProposals.length === 0 && (
            <div className="px-6 py-12 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">
                Keine Workshop-Vorschläge gefunden
              </Heading>
              <p className="text-gray-600 mb-4">
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
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </AdminPageWrapper>
  )
}
