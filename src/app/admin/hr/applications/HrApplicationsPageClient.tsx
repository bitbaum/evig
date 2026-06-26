'use client'

import Link from 'next/link'
import { FileText, UserCheck, Briefcase, Inbox } from 'lucide-react'
import { useTranslations } from 'next-intl'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminListShell } from '@/components/admin/AdminListShell'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_OPTIONS,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from '@/config/hr-application-status'
import type { HrFunnelStats } from '@/lib/types/hr'
import {
  ApplicationActionDialog,
  ApplicationCard,
  useHrApplications,
} from '@/components/admin/hr'

interface Props {
  stats: HrFunnelStats
  initialPostingFilter?: string
}

export default function HrApplicationsPageClient({ stats, initialPostingFilter }: Props) {
  const t = useTranslations('admin.hr.applications')
  const {
    applications,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    postingFilter,
    actionLoading,
    successMessage,
    hireProfileUrl,
    actionDialog,
    setActionDialog,
    expandedId,
    setExpandedId,
    openAdvanceDialog,
    openRejectDialog,
    openHireDialog,
    closeDialog,
    submitAction,
    fetchApplications,
  } = useHrApplications(initialPostingFilter)

  const hasActiveFilters = statusFilter !== 'all' || Boolean(searchQuery) || Boolean(postingFilter)

  return (
    <AdminPageWrapper
      title={t('title')}
      description={t('description')}
      icon={FileText}
      iconColor="blue"
      actions={
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={ROUTES.admin.hrVacancies} className="text-action hover:underline">
            {t('manageVacancies')}
          </Link>
          <Link href={ROUTES.admin.team} className="text-action hover:underline">
            {t('teamProfiles')}
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {successMessage && (
          <div className="bg-action-muted border border-strong rounded-lg p-3 text-sm text-action flex flex-wrap items-center gap-3">
            <span>{successMessage}</span>
            {hireProfileUrl && (
              <Link href={hireProfileUrl} className="font-medium underline">
                {t('openTeamProfile')}
              </Link>
            )}
          </div>
        )}

        <AdminStatsGrid
          columns={4}
          items={[
            {
              icon: Inbox,
              color: 'blue',
              label: APPLICATION_STATUS_LABELS.new,
              value: stats.byStatus.new ?? 0,
            },
            {
              icon: FileText,
              color: 'amber',
              label: APPLICATION_STATUS_LABELS.screening,
              value: stats.byStatus.screening ?? 0,
            },
            {
              icon: UserCheck,
              color: 'green',
              label: APPLICATION_STATUS_LABELS.offer,
              value: stats.byStatus.offer ?? 0,
            },
            {
              icon: Briefcase,
              color: 'green',
              label: APPLICATION_STATUS_LABELS.hired,
              value: stats.byStatus.hired ?? 0,
            },
          ]}
        />

        {actionDialog && (
          <ApplicationActionDialog
            dialog={actionDialog}
            onChange={(patch) => setActionDialog((d) => (d ? { ...d, ...patch } : d))}
            onSubmit={submitAction}
            onClose={closeDialog}
            isLoading={actionLoading === actionDialog.applicationId}
          />
        )}

        <AdminListShell
          filters={
            <AdminFilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t('searchPlaceholder')}
              dropdowns={[
                {
                  key: 'status',
                  label: t('statusFilter'),
                  value: statusFilter,
                  onChange: (value) => setStatusFilter(value as ApplicationStatus | 'all'),
                  options: APPLICATION_STATUS_OPTIONS.map((s) => ({
                    value: s,
                    label: APPLICATION_STATUS_LABELS[s],
                  })),
                },
              ]}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setStatusFilter(APPLICATION_STATUS.NEW)
                setSearchQuery('')
              }}
            />
          }
          loading={loading}
          error={error}
          onRetry={fetchApplications}
          isEmpty={applications.length === 0}
          emptyIcon={FileText}
          emptyTitle={t('empty')}
          resultsLabel={t('resultsCount', { count: applications.length })}
        >
          <div className="space-y-4">
            {applications.map((app) => (
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
            ))}
          </div>
        </AdminListShell>
      </div>
    </AdminPageWrapper>
  )
}
