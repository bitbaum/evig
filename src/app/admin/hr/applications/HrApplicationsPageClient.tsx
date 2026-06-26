'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'
import {
  ApplicationActionDialog,
  ApplicationCard,
  ApplicationFilters,
  useHrApplications,
} from '@/components/admin/hr'

export default function HrApplicationsPageClient() {
  const {
    applications,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionLoading,
    successMessage,
    actionDialog,
    setActionDialog,
    expandedId,
    setExpandedId,
    openAdvanceDialog,
    openRejectDialog,
    openHireDialog,
    closeDialog,
    submitAction,
  } = useHrApplications()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <AdminPageWrapper
      title="Bewerbungen"
      description="Pipeline von der Sichtung bis zur Einstellung"
      icon={FileText}
      iconColor="blue"
      actions={
        <Link href={ROUTES.admin.hrVacancies} className="text-sm text-primary-600 hover:underline">
          Stellen verwalten
        </Link>
      }
    >
      {successMessage && (
        <div className="bg-action-muted border border-strong rounded-lg p-3 text-sm text-action">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-sm text-error-800">
          {error}
        </div>
      )}

      {actionDialog && (
        <ApplicationActionDialog
          dialog={actionDialog}
          onChange={(patch) => setActionDialog((d) => (d ? { ...d, ...patch } : d))}
          onSubmit={submitAction}
          onClose={closeDialog}
        />
      )}

      <ApplicationFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      <div className="space-y-4 mt-4">
        {applications.length === 0 ? (
          <div className="text-center py-16 text-text-muted">Keine Bewerbungen in diesem Filter.</div>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              expanded={expandedId === app.id}
              actionLoading={actionLoading}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onAdvance={() => openAdvanceDialog(app.id, app.status)}
              onReject={() => openRejectDialog(app.id)}
              onHire={() => openHireDialog(app.id)}
            />
          ))
        )}
      </div>
    </AdminPageWrapper>
  )
}
