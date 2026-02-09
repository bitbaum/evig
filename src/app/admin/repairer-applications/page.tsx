'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Star,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react'

// Simple certification item (for display in application list)
interface CertificationItem {
  name?: string
  type?: string
  issuer?: string
}

interface RepairerApplication {
  id: string
  userId: string
  applicantName: string
  applicantEmail: string
  userCreatedAt: string
  businessName: string | null
  businessType: string
  description: string
  yearsExperience: number
  phone: string
  website: string | null
  address: string
  city: string
  postalCode: string
  serviceRadiusKm: number
  remoteServices: boolean
  hourlyRateCents: number | null
  emergencyFeeCents: number | null
  homeVisitFeeCents: number | null
  servicesOffered: string[]
  specializations: string[]
  certifications: (CertificationItem | string)[]
  insuranceInfo: string | null
  portfolioImages: string[]
  verificationDocuments: string[]
  termsAccepted: boolean
  status: string
  documentVerificationStatus: string
  adminNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  // Document verification fields
  documents?: VerificationDocument[]
  missingRequiredDocuments?: DocumentType[]
}

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'requires_changes'

interface VerificationDocument {
  id: string
  applicationId: string
  documentTypeId: string | null
  documentTypeName: string | null
  documentTypeDescription: string | null
  isRequired: boolean
  filename: string
  originalFilename: string
  filePath: string
  fileSizeBytes: number | null
  mimeType: string | null
  status: string
  adminNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface DocumentType {
  id: string
  slug: string
  name: string
  description: string
  maxFileSizeMb: number
  allowedExtensions: string[]
}

interface VerificationResult {
  verified: boolean
  verifiedAt?: string
  notes?: string
  method?: string
}

interface Certification {
  id: string
  applicationId: string
  certificationTypeId: string | null
  certificationTypeName: string | null
  certificationTypeDescription: string | null
  category: string | null
  customName: string | null
  issuingAuthority: string | null
  certificationNumber: string | null
  issueDate: string | null
  expiryDate: string | null
  verificationStatus: string
  verificationMethod: string
  verificationResult: VerificationResult | null
  adminNotes: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  documentPath: string | null
  createdAt: string
  updatedAt: string
  isExpired: boolean
  daysUntilExpiry: number | null
}

export default function RepairerApplicationsAdmin() {
  const router = useRouter()
  const [applications, setApplications] = useState<RepairerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('pending')
  const [selectedApplication, setSelectedApplication] = useState<RepairerApplication | null>(null)
  const [selectedApplicationDocuments, setSelectedApplicationDocuments] = useState<VerificationDocument[]>([])
  const [selectedApplicationCertifications, setSelectedApplicationCertifications] = useState<Certification[]>([])
  const [missingRequiredDocuments, setMissingRequiredDocuments] = useState<DocumentType[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [documentActionLoading, setDocumentActionLoading] = useState<string | null>(null)
  const [certificationActionLoading, setCertificationActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve_app' | 'reject_app' | 'request_changes' | 'approve_doc' | 'reject_doc' | 'verify_cert' | 'reject_cert'
    targetId: string
    reason: string
    notes: string
    expiresAt: string
  } | null>(null)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/repairer-applications?status=${selectedStatus}`)
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      const data = await response.json()
      setApplications(data.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const openDialog = (type: NonNullable<typeof actionDialog>['type'], targetId: string) => {
    setActionDialog({ type, targetId, reason: '', notes: '', expiresAt: '' })
  }

  const closeDialog = () => setActionDialog(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const submitAction = async () => {
    if (!actionDialog) return
    const { type, targetId, reason, notes, expiresAt } = actionDialog

    // Validate required fields
    if (['reject_app', 'request_changes', 'reject_doc', 'reject_cert'].includes(type) && !reason.trim()) return

    const loadingSetter = type.includes('doc') ? setDocumentActionLoading
      : type.includes('cert') ? setCertificationActionLoading
      : setActionLoading

    loadingSetter(targetId)
    closeDialog()

    try {
      let url = ''
      let body: Record<string, unknown> = {}

      switch (type) {
        case 'approve_app':
          url = `/api/admin/repairer-applications/${targetId}/approve`
          body = { adminNotes: notes || undefined }
          break
        case 'reject_app':
          url = `/api/admin/repairer-applications/${targetId}/reject`
          body = { rejectionReason: reason, adminNotes: notes || undefined }
          break
        case 'request_changes':
          url = `/api/admin/repairer-applications/${targetId}/request-changes`
          body = { requestedChanges: reason, adminNotes: notes || undefined }
          break
        case 'approve_doc':
          url = `/api/admin/documents/${targetId}/approve`
          body = { adminNotes: notes || undefined, expiresAt: expiresAt || undefined }
          break
        case 'reject_doc':
          url = `/api/admin/documents/${targetId}/reject`
          body = { rejectionReason: reason, adminNotes: notes || undefined }
          break
        case 'verify_cert':
          url = `/api/admin/certifications/${targetId}/verify`
          body = { adminNotes: notes || undefined, verificationResult: { verified: true, verifiedAt: new Date().toISOString() } }
          break
        case 'reject_cert':
          url = `/api/admin/certifications/${targetId}/reject`
          body = { rejectionReason: reason, adminNotes: notes || undefined }
          break
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Aktion fehlgeschlagen')

      // Refresh data
      if (type.includes('doc') && selectedApplication) {
        await fetchApplicationDocuments(selectedApplication.id)
        await fetchApplications()
      } else if (type.includes('cert') && selectedApplication) {
        await fetchApplicationCertifications(selectedApplication.id)
      } else {
        await fetchApplications()
      }

      const labels: Record<string, string> = {
        approve_app: 'Bewerbung genehmigt',
        reject_app: 'Bewerbung abgelehnt',
        request_changes: 'Änderungen angefordert',
        approve_doc: 'Dokument genehmigt',
        reject_doc: 'Dokument abgelehnt',
        verify_cert: 'Zertifizierung verifiziert',
        reject_cert: 'Zertifizierung abgelehnt',
      }
      showSuccess(labels[type] + '!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      loadingSetter(null)
    }
  }

  const fetchApplicationDocuments = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/documents?applicationId=${applicationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setSelectedApplicationDocuments(data.documents || [])
      setMissingRequiredDocuments(data.missingRequiredDocuments || [])
    } catch (err) {
      logger.error('Error fetching documents', { error: err })
      setSelectedApplicationDocuments([])
      setMissingRequiredDocuments([])
    }
  }

  const fetchApplicationCertifications = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/certifications?applicationId=${applicationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch certifications')
      }
      const data = await response.json()
      setSelectedApplicationCertifications(data.certifications || [])
    } catch (err) {
      logger.error('Error fetching certifications', { error: err })
      setSelectedApplicationCertifications([])
    }
  }

  const handleApplicationSelect = (application: RepairerApplication) => {
    setSelectedApplication(application)
    fetchApplicationDocuments(application.id)
    fetchApplicationCertifications(application.id)
  }

  // Document and certification handlers now use the unified actionDialog via openDialog/submitAction

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'requires_changes':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      requires_changes: 'bg-orange-100 text-orange-800'
    }

    const labels = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      requires_changes: 'Änderungen erforderlich'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status as keyof typeof labels] || 'Ausstehend'}</span>
      </span>
    )
  }

  const filteredApplications = applications.filter(app =>
    searchQuery === '' ||
    app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Fehler beim Laden</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Admin-Bereich
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reparateur-Bewerbungen</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Action Dialog */}
      {actionDialog && (
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {{
              approve_app: 'Bewerbung genehmigen',
              reject_app: 'Bewerbung ablehnen',
              request_changes: 'Änderungen anfordern',
              approve_doc: 'Dokument genehmigen',
              reject_doc: 'Dokument ablehnen',
              verify_cert: 'Zertifizierung verifizieren',
              reject_cert: 'Zertifizierung ablehnen',
            }[actionDialog.type]}
          </h3>

          {['reject_app', 'request_changes', 'reject_doc', 'reject_cert'].includes(actionDialog.type) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionDialog.type === 'request_changes' ? 'Geforderte Änderungen (erforderlich):' : 'Grund (erforderlich):'}
              </label>
              <textarea
                value={actionDialog.reason}
                onChange={(e) => setActionDialog(prev => prev ? { ...prev, reason: e.target.value } : null)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
          )}

          {actionDialog.type === 'approve_doc' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ablaufdatum (YYYY-MM-DD, optional):
              </label>
              <input
                type="date"
                value={actionDialog.expiresAt}
                onChange={(e) => setActionDialog(prev => prev ? { ...prev, expiresAt: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin-Notizen (optional):
            </label>
            <textarea
              value={actionDialog.notes}
              onChange={(e) => setActionDialog(prev => prev ? { ...prev, notes: e.target.value } : null)}
              rows={2}
              placeholder="Optionale Notizen..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={submitAction}
              disabled={['reject_app', 'request_changes', 'reject_doc', 'reject_cert'].includes(actionDialog.type) && !actionDialog.reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bestätigen
            </button>
            <button
              onClick={closeDialog}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected', 'requires_changes'] as ApplicationStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'pending' && 'Ausstehend'}
                  {status === 'approved' && 'Genehmigt'}
                  {status === 'rejected' && 'Abgelehnt'}
                  {status === 'requires_changes' && 'Änderungen erforderlich'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suchen nach Name, E-Mail oder Beschreibung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bewerbungen gefunden</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Keine Bewerbungen entsprechen Ihrer Suchanfrage.'
                : `Keine Bewerbungen mit Status "${selectedStatus}".`
              }
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Application Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.businessName || application.applicantName}
                      </h3>
                      {getStatusBadge(application.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.documentVerificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        application.documentVerificationStatus === 'in_review' ? 'bg-blue-100 text-blue-800' :
                        application.documentVerificationStatus === 'incomplete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Dokumente: {
                          application.documentVerificationStatus === 'approved' ? 'Verifiziert' :
                          application.documentVerificationStatus === 'in_review' ? 'In Prüfung' :
                          application.documentVerificationStatus === 'incomplete' ? 'Unvollständig' :
                          'Ausstehend'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                          className="flex items-center gap-1 text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Website
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>Bewerbung vom {new Date(application.createdAt).toLocaleDateString('de-CH')}</span>
                      <span>{application.yearsExperience} Jahre Erfahrung</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {application.city} ({application.postalCode})
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedStatus === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDialog('request_changes', application.id)}
                        disabled={actionLoading === application.id}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 text-sm font-medium"
                      >
                        {actionLoading === application.id ? '...' : 'Änderungen anfordern'}
                      </button>
                      <button
                        onClick={() => openDialog('reject_app', application.id)}
                        disabled={actionLoading === application.id}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 text-sm font-medium"
                      >
                        {actionLoading === application.id ? '...' : 'Ablehnen'}
                      </button>
                      <button
                        onClick={() => openDialog('approve_app', application.id)}
                        disabled={actionLoading === application.id}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {actionLoading === application.id ? '...' : 'Genehmigen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Beschreibung</h4>
                      <p className="text-gray-600 text-sm">{application.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Dienstleistungen</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.servicesOffered.map((service, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Spezialisierungen</h4>
                      <div className="flex flex-wrap gap-2">
                        {application.specializations.map((spec, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {application.certifications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Zertifizierungen</h4>
                        <div className="space-y-1">
                          {application.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{typeof cert === 'string' ? cert : cert.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Stundensatz</h4>
                        <p className="text-gray-600 text-sm">
                          {application.hourlyRateCents
                            ? `CHF ${(application.hourlyRateCents / 100).toFixed(0)}/Std`
                            : 'Nicht angegeben'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Service-Radius</h4>
                        <p className="text-gray-600 text-sm">{application.serviceRadiusKm} km</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Adresse</h4>
                      <p className="text-gray-600 text-sm">
                        {application.address}<br />
                        {application.postalCode} {application.city}
                      </p>
                    </div>

                    {application.verificationDocuments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Verifizierungsdokumente</h4>
                        <div className="space-y-1">
                          {application.verificationDocuments.map((doc, index) => (
                            <a
                              key={index}
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-4 h-4" />
                              Dokument {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {application.adminNotes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Admin-Notizen</h4>
                        <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{application.adminNotes}</p>
                      </div>
                    )}

                    {/* Document Verification Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Dokumentenverifizierung</h4>
                        <button
                          onClick={() => handleApplicationSelect(application)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Dokumente prüfen
                        </button>
                      </div>

                      {selectedApplication?.id === application.id && (
                        <div className="space-y-4">
                          {/* Uploaded Documents */}
                          {selectedApplicationDocuments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Dokumente</h5>
                              <div className="space-y-2">
                                {selectedApplicationDocuments.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        doc.status === 'approved' ? 'bg-green-500' :
                                        doc.status === 'rejected' ? 'bg-red-500' :
                                        'bg-yellow-500'
                                      }`} />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {doc.documentTypeName || doc.originalFilename}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {doc.originalFilename} • {
                                            doc.fileSizeBytes
                                              ? `${Math.round(doc.fileSizeBytes / 1024)} KB`
                                              : 'Unbekannte Grösse'
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={doc.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 text-sm"
                                      >
                                        Anzeigen
                                      </a>
                                      {doc.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => openDialog('approve_doc', doc.id)}
                                            disabled={documentActionLoading === doc.id}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                                          >
                                            {documentActionLoading === doc.id ? '...' : 'Genehmigen'}
                                          </button>
                                          <button
                                            onClick={() => openDialog('reject_doc', doc.id)}
                                            disabled={documentActionLoading === doc.id}
                                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                                          >
                                            {documentActionLoading === doc.id ? '...' : 'Ablehnen'}
                                          </button>
                                        </>
                                      )}
                                      {doc.status === 'approved' && (
                                        <span className="text-xs text-green-600 font-medium">Genehmigt</span>
                                      )}
                                      {doc.status === 'rejected' && (
                                        <span className="text-xs text-red-600 font-medium">Abgelehnt</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Required Documents */}
                          {missingRequiredDocuments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-red-700 mb-2">Fehlende erforderliche Dokumente</h5>
                              <div className="space-y-2">
                                {missingRequiredDocuments.map((docType) => (
                                  <div key={docType.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div>
                                      <p className="text-sm font-medium text-red-800">{docType.name}</p>
                                      <p className="text-xs text-red-600">{docType.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedApplicationDocuments.length === 0 && missingRequiredDocuments.length === 0 && (
                            <p className="text-sm text-gray-600">Keine Dokumente verfügbar</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Certification Verification Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Zertifizierungsverifizierung</h4>
                          <button
                            onClick={() => handleApplicationSelect(application)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Zertifizierungen prüfen
                          </button>
                        </div>

                        {selectedApplication?.id === application.id && (
                          <div className="space-y-4">
                            {/* Certifications */}
                            {selectedApplicationCertifications.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Eingereichte Zertifizierungen</h5>
                                <div className="space-y-3">
                                  {selectedApplicationCertifications.map((cert) => (
                                    <div key={cert.id} className="p-4 bg-gray-50 rounded-lg">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h6 className="font-medium text-gray-900">
                                              {cert.certificationTypeName || cert.customName}
                                            </h6>
                                            {cert.category && (
                                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                {cert.category}
                                              </span>
                                            )}
                                            {cert.isExpired && (
                                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                Abgelaufen
                                              </span>
                                            )}
                                            {cert.daysUntilExpiry && cert.daysUntilExpiry <= 90 && cert.daysUntilExpiry > 0 && (
                                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                                Läuft ab in {cert.daysUntilExpiry} Tagen
                                              </span>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            {cert.issuingAuthority && (
                                              <div>
                                                <span className="font-medium">Ausstellende Stelle:</span><br />
                                                {cert.issuingAuthority}
                                              </div>
                                            )}
                                            {cert.certificationNumber && (
                                              <div>
                                                <span className="font-medium">Zertifizierungsnummer:</span><br />
                                                {cert.certificationNumber}
                                              </div>
                                            )}
                                            {cert.issueDate && (
                                              <div>
                                                <span className="font-medium">Ausstellungsdatum:</span><br />
                                                {new Date(cert.issueDate).toLocaleDateString('de-CH')}
                                              </div>
                                            )}
                                            {cert.expiryDate && (
                                              <div>
                                                <span className="font-medium">Ablaufdatum:</span><br />
                                                {new Date(cert.expiryDate).toLocaleDateString('de-CH')}
                                              </div>
                                            )}
                                          </div>

                                          {cert.adminNotes && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                              <strong>Admin-Notiz:</strong> {cert.adminNotes}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                          {cert.verificationStatus === 'pending' && (
                                            <>
                                              <button
                                                onClick={() => openDialog('verify_cert', cert.id)}
                                                disabled={certificationActionLoading === cert.id}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                              >
                                                {certificationActionLoading === cert.id ? '...' : 'Verifizieren'}
                                              </button>
                                              <button
                                                onClick={() => openDialog('reject_cert', cert.id)}
                                                disabled={certificationActionLoading === cert.id}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                              >
                                                {certificationActionLoading === cert.id ? '...' : 'Ablehnen'}
                                              </button>
                                            </>
                                          )}
                                          {cert.verificationStatus === 'verified' && (
                                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                              Verifiziert
                                            </span>
                                          )}
                                          {cert.verificationStatus === 'rejected' && (
                                            <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                                              Abgelehnt
                                            </span>
                                          )}
                                          {cert.verificationStatus === 'expired' && (
                                            <span className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                              Abgelaufen
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedApplicationCertifications.length === 0 && (
                              <p className="text-sm text-gray-600">Keine Zertifizierungen eingereicht</p>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}