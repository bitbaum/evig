'use client'

import Link from 'next/link'
import { Plus, Briefcase } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import {
  VacancyCard,
  VacancyFilters,
  useHrVacancies,
} from '@/components/admin/hr'

export default function HrVacanciesPageClient() {
  const {
    postings,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionLoading,
    successMessage,
    transitionStatus,
    duplicateVacancy,
    copyPublicLink,
    shareVacancy,
  } = useHrVacancies()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <AdminPageWrapper
      title="Offene Stellen"
      description="Stellen veröffentlichen, pausieren und mit Bewerbern verknüpfen"
      icon={Briefcase}
      iconColor="green"
      actions={
        <Link href={ROUTES.admin.hrVacancyNew}>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Neue Stelle
          </Button>
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

      <VacancyFilters
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
      />

      <div className="space-y-4 mt-4">
        {postings.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            Keine Stellen gefunden.
          </div>
        ) : (
          postings.map((vacancy) => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              actionLoading={actionLoading}
              onTransition={transitionStatus}
              onDuplicate={duplicateVacancy}
              onCopyLink={copyPublicLink}
              onShare={shareVacancy}
            />
          ))
        )}
      </div>
    </AdminPageWrapper>
  )
}
