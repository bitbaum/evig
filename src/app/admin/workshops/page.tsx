'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  BookOpen,
  ArrowLeft
} from 'lucide-react'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { PROPOSAL_STATUS, PROPOSAL_STATUS_LABELS, WORKSHOP_CATEGORIES, type ProposalStatus } from '@/config/workshops'
import type { WorkshopProposalWithProposer } from '@/components/workshops/types'

export default function AdminWorkshopsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [proposals, setProposals] = useState<WorkshopProposalWithProposer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [filters, setFilters] = useState<{
    status: ProposalStatus | 'all'
    category: string
  }>({
    status: PROPOSAL_STATUS.PENDING,
    category: 'all'
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadProposals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filters.status,
        limit: '20',
        offset: ((currentPage - 1) * 20).toString()
      })

      if (filters.category !== 'all') params.set('category', filters.category)

      const response = await fetch(`/api/admin/workshops/proposals?${params}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setProposals(result.data.items || [])
          setTotalPages(Math.ceil((result.data.pagination?.total || 0) / 20))
        } else {
          setError(ERROR_MESSAGES.WORKSHOP_PROPOSALS_LOAD_FAILED)
        }
      } else {
        setError(ERROR_MESSAGES.WORKSHOP_PROPOSALS_LOAD_FAILED)
      }
    } catch (error) {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.category, currentPage])

  useEffect(() => {
    if (status === 'authenticated') {
      loadProposals()
    }
  }, [status, loadProposals])

  const handleApprove = async (proposalId: string) => {
    if (!confirm('Möchten Sie diesen Workshop-Vorschlag wirklich genehmigen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/workshops/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          review_notes: 'Workshop genehmigt'
        })
      })

      if (response.ok) {
        loadProposals()
      } else {
        setError('Fehler bei der Genehmigung')
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }

  const handleReject = async (proposalId: string) => {
    if (!rejectionReason.trim()) return

    try {
      const response = await fetch(`/api/admin/workshops/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          review_notes: rejectionReason
        })
      })

      if (response.ok) {
        setRejectingId(null)
        setRejectionReason('')
        loadProposals()
      } else {
        setError('Fehler bei der Ablehnung')
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case PROPOSAL_STATUS.APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case PROPOSAL_STATUS.PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />
      case PROPOSAL_STATUS.REJECTED:
        return <XCircle className="w-5 h-5 text-red-600" />
      case PROPOSAL_STATUS.REQUIRES_CHANGES:
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    return PROPOSAL_STATUS_LABELS[status as ProposalStatus] || status
  }

  const getLocationText = (proposal: WorkshopProposalWithProposer) => {
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workshop-Verwaltung</h1>
              <p className="mt-1 text-sm text-gray-600">
                Genehmigen und verwalten Sie Workshop-Vorschläge
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/workshops/instances"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Termine verwalten
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ProposalStatus | 'all' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle</option>
                <option value="pending">Ausstehend</option>
                <option value="approved">Genehmigt</option>
                <option value="rejected">Abgelehnt</option>
                <option value="requires_changes">Änderungen erforderlich</option>
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle Kategorien</option>
                {WORKSHOP_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Proposals List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Workshop-Vorschläge ({proposals.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {proposal.title}
                      </h3>
                      {getStatusIcon(proposal.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(proposal.status)}
                      </span>
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
                      Vorgeschlagen von {proposal.proposer_name} ({proposal.proposer_email}) • {new Date(proposal.created_at).toLocaleDateString('de-CH')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/admin/workshops/${proposal.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Link>

                    {proposal.status === 'pending' && (
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
                      placeholder="Bitte geben Sie einen Ablehnungsgrund an..."
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
            ))}

            {proposals.length === 0 && !loading && (
              <div className="px-6 py-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Workshop-Vorschläge gefunden</h3>
                <p className="text-gray-600 mb-4">
                  {filters.status === 'pending' ? 'Keine ausstehenden Vorschläge vorhanden.' : `Keine Vorschläge mit Status "${filters.status}" gefunden.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← Zurück
              </button>

              <span className="px-4 py-2 text-sm text-gray-700">
                Seite {currentPage} von {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Weiter →
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}