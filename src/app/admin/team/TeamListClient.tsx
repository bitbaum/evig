'use client'

/**
 * Team List Client Component
 *
 * Filtering + display of team profiles, on the shared AdminListShell
 * scaffold (error / loading / empty / results states). Keeps its skeleton
 * loading grid via loadingSlot.
 */

import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'
import {
  TeamFilters,
  TeamMemberCard,
  useTeamProfiles,
} from '@/components/admin/team'
import { AdminListShell } from '@/components/admin/AdminListShell'

function TeamGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-subtle bg-surface-base p-5"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-surface-overlay" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded-sm bg-surface-overlay" />
              <div className="h-4 w-1/2 rounded-sm bg-surface-overlay" />
              <div className="h-3 w-full rounded-sm bg-surface-overlay" />
            </div>
          </div>
          <div className="mt-4 border-t border-subtle pt-4">
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-sm bg-surface-overlay" />
              <div className="h-8 flex-1 rounded-sm bg-surface-overlay" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeamListClient() {
  const t = useTranslations('admin.team.list')
  const { profiles, loading, error, filters, setFilters, refetch } = useTeamProfiles()

  const hasActiveFilters = Boolean(
    filters.search || filters.department || filters.employmentType,
  )

  return (
    <AdminListShell
      filters={
        <TeamFilters
          department={filters.department}
          employmentType={filters.employmentType}
          isActive={filters.isActive}
          search={filters.search}
          onDepartmentChange={(value) => setFilters({ department: value })}
          onEmploymentTypeChange={(value) => setFilters({ employmentType: value })}
          onIsActiveChange={(value) => setFilters({ isActive: value })}
          onSearchChange={(value) => setFilters({ search: value })}
        />
      }
      loading={loading}
      loadingSlot={<TeamGridSkeleton />}
      error={error}
      onRetry={refetch}
      isEmpty={profiles.length === 0}
      emptyIcon={Users}
      emptyTitle={t('emptyHeading')}
      emptyDescription={hasActiveFilters ? t('emptyWithFilters') : t('emptyNoFilters')}
      hasActiveFilters={hasActiveFilters}
      onResetFilters={() =>
        setFilters({ search: '', department: '', employmentType: '', isActive: 'all' })
      }
      resultsLabel={t('profilesCount', { count: profiles.length })}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <TeamMemberCard
            key={profile.id}
            member={{
              id: profile.id,
              user_id: profile.user_id,
              user_name: profile.user_name,
              user_email: profile.user_email,
              position: profile.position,
              department: profile.department,
              employment_type: profile.employment_type,
              start_date: profile.start_date,
              skills: profile.skills || [],
              is_active: profile.is_active,
            }}
          />
        ))}
      </div>
    </AdminListShell>
  )
}
