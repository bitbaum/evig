'use client'

import { useRouter } from 'next/navigation'
import { XCircle, FileText, ArrowLeft } from 'lucide-react'
import {
  useRepairerApplications,
  ApplicationFilters,
  ApplicationActionDialog,
  ApplicationCard,
  ApplicationDetails,
  DocumentVerificationSection,
  CertificationVerificationSection,
} from '@/components/admin/repairer-applications'
import { APPROVAL_STATUS } from '@/config/approval-status'
import Heading from '@/components/admin/AdminHeading'

export default function RepairerApplicationsAdmin() {
  const router = useRouter()
  const {
    applications,
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
  } = useRepairerApplications()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-error-400" />
          <div className="ml-3">
            <Heading level={3} className="text-sm font-medium text-error-800">Fehler beim Laden</Heading>
            <p className="text-sm text-error-700 mt-1">{error}</p>
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
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Admin-Bereich
          </button>
        </div>
        <Heading level={1} className="text-2xl font-bold text-neutral-900">Techniker-Bewerbungen</Heading>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-primary-800">{successMessage}</p>
        </div>
      )}

      {/* Action Dialog */}
      {actionDialog && (
        <ApplicationActionDialog
          dialog={actionDialog}
          onDialogChange={setActionDialog}
          onSubmit={submitAction}
          onClose={closeDialog}
        />
      )}

      <ApplicationFilters
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
      />

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">Keine Bewerbungen gefunden</Heading>
            <p className="text-neutral-600">
              {searchQuery
                ? 'Keine Bewerbungen entsprechen Ihrer Suchanfrage.'
                : `Keine Bewerbungen mit Status "${selectedStatus}".`
              }
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <ApplicationCard
                application={application}
                isPending={selectedStatus === APPROVAL_STATUS.PENDING}
                actionLoading={actionLoading}
                onOpenDialog={openDialog}
              />

              <div className="p-6">
                <ApplicationDetails application={application} />

                <DocumentVerificationSection
                  application={application}
                  isSelected={selectedApplication?.id === application.id}
                  documents={selectedApplicationDocuments}
                  missingRequiredDocuments={missingRequiredDocuments}
                  documentActionLoading={documentActionLoading}
                  onSelect={handleApplicationSelect}
                  onOpenDialog={openDialog}
                />

                <CertificationVerificationSection
                  application={application}
                  isSelected={selectedApplication?.id === application.id}
                  certifications={selectedApplicationCertifications}
                  certificationActionLoading={certificationActionLoading}
                  onSelect={handleApplicationSelect}
                  onOpenDialog={openDialog}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
