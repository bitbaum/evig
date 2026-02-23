import { useState, useEffect, useCallback } from 'react'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'
import type {
  RepairerApplication,
  ApplicationStatus,
  VerificationDocument,
  Certification,
  DocumentType,
  ActionDialogState,
} from './types'

export function useRepairerApplications() {
  const [applications, setApplications] = useState<RepairerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(APPROVAL_STATUS.PENDING)
  const [selectedApplication, setSelectedApplication] = useState<RepairerApplication | null>(null)
  const [selectedApplicationDocuments, setSelectedApplicationDocuments] = useState<VerificationDocument[]>([])
  const [selectedApplicationCertifications, setSelectedApplicationCertifications] = useState<Certification[]>([])
  const [missingRequiredDocuments, setMissingRequiredDocuments] = useState<DocumentType[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [documentActionLoading, setDocumentActionLoading] = useState<string | null>(null)
  const [certificationActionLoading, setCertificationActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(null)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/repairer-applications?status=${selectedStatus}`)
      if (!response.ok) throw new Error('Failed to fetch applications')
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

  const openDialog = (type: ActionDialogState['type'], targetId: string) => {
    setActionDialog({ type, targetId, reason: '', notes: '', expiresAt: '' })
  }

  const closeDialog = () => setActionDialog(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const fetchApplicationDocuments = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/documents?applicationId=${applicationId}`)
      if (!response.ok) throw new Error('Failed to fetch documents')
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
      if (!response.ok) throw new Error('Failed to fetch certifications')
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

  const submitAction = async () => {
    if (!actionDialog) return
    const { type, targetId, reason, notes, expiresAt } = actionDialog

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

  const filteredApplications = applications.filter(app =>
    searchQuery === '' ||
    app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return {
    applications: filteredApplications,
    loading,
    error,
    selectedStatus,
    setSelectedStatus,
    selectedApplication,
    selectedApplicationDocuments,
    selectedApplicationCertifications,
    missingRequiredDocuments,
    actionLoading,
    documentActionLoading,
    certificationActionLoading,
    searchQuery,
    setSearchQuery,
    successMessage,
    actionDialog,
    setActionDialog,
    openDialog,
    closeDialog,
    submitAction,
    handleApplicationSelect,
  }
}
