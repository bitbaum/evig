'use client'

import Link from 'next/link'
import { Plus, Briefcase, Users, FileText, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminListShell } from '@/components/admin/AdminListShell'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import { AdminFilterBar } from '@/components/admin/AdminFilterBar'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import {
  VACANCY_STATUS_OPTIONS,
  VACANCY_STATUS_LABELS,
  type VacancyStatus,
} from '@/config/hr-vacancies'
import type { HrFunnelStats } from '@/lib/types/hr'
import {
  VacancyCard,
  useHrVacancies,
} from '@/components/admin/hr'

interface Props {
  stats: HrFunnelStats
}

export default function HrVacanciesPageClient({ stats }: Props) {
  const t = useTranslations('admin.hr.vacancies')
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
    fetchPostings,
  } = useHrVacancies()

  const hasActiveFilters = Boolean(statusFilter || searchQuery)

  return (
    <AdminPageWrapper
      title={t('title')}
      description={t('description')}
      icon={Briefcase}
      iconColor="green"
      actions={
        <Link href={ROUTES.admin.hrVacancyNew}>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            {t('new')}
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {successMessage && (
          <div className="bg-action-muted border border-strong rounded-lg p-3 text-sm text-action">
            {successMessage}
          </div>
        )}

        <AdminStatsGrid
          columns={4}
          items={[
            {
              icon: Briefcase,
              color: 'green',
              label: t('stats.published'),
              value: stats.publishedVacancies,
              valueColor: 'text-action',
            },
            {
              icon: FileText,
              color: 'blue',
              label: t('stats.pendingApplications'),
              value: stats.pendingApplications,
              valueColor: 'text-info-600 dark:text-info-400',
            },
            {
              icon: Users,
              color: 'amber',
              label: t('stats.drafts'),
              value: stats.draftVacancies,
            },
            {
              icon: CheckCircle2,
              color: 'green',
              label: t('stats.filled'),
              value: stats.filledVacancies,
            },
          ]}
        />

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
                  value: statusFilter || 'all',
                  onChange: (value) => setStatusFilter(value === 'all' ? '' : value),
                  options: VACANCY_STATUS_OPTIONS.map((s) => ({
                    value: s,
                    label: VACANCY_STATUS_LABELS[s as VacancyStatus],
                  })),
                },
              ]}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setStatusFilter('')
                setSearchQuery('')
              }}
            />
          }
          loading={loading}
          error={error}
          onRetry={fetchPostings}
          isEmpty={postings.length === 0}
          emptyIcon={Briefcase}
          emptyTitle={t('empty')}
          emptyAction={
            <Link href={ROUTES.admin.hrVacancyNew}>
              <Button variant="primary" size="sm">
                {t('new')}
              </Button>
            </Link>
          }
          resultsLabel={t('resultsCount', { count: postings.length })}
        >
          <div className="space-y-4">
            {postings.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                actionLoading={actionLoading}
                onTransition={transitionStatus}
                onDuplicate={duplicateVacancy}
                onCopyLink={copyPublicLink}
                onShare={shareVacancy}
              />
            ))}
          </div>
        </AdminListShell>
      </div>
    </AdminPageWrapper>
  )
}
