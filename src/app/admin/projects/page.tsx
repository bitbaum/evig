/**
 * Admin Projects List — counts of open needs + new contributions per project.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { projects, projectNeeds, projectContributions } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/config/routes'
import { NEED_STATUSES, CONTRIBUTION_STATUSES } from '@/config/projects'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import { Lightbulb, Rocket, Handshake, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Öffentliche Projekte',
  description: 'Bedarfe verwalten und eingehende Beiträge triagieren.',
}

async function getProjectsOverview() {
  try {
    return await db
      .select({
        id: projects.id,
        slug: projects.slug,
        isActive: projects.isActive,
        openNeeds: sql<number>`(
          SELECT COUNT(*)::int FROM ${projectNeeds} n
          WHERE n.project_id = ${projects.id} AND n.status = ${NEED_STATUSES.OPEN}
        )`,
        newContributions: sql<number>`(
          SELECT COUNT(*)::int FROM ${projectContributions} c
          WHERE c.project_id = ${projects.id} AND c.status = ${CONTRIBUTION_STATUSES.NEW}
        )`,
      })
      .from(projects)
      .orderBy(sql`${projects.isActive} DESC, ${projects.slug} ASC`)
  } catch (error) {
    logger.error('Error fetching projects overview', { error })
    return []
  }
}

export default async function AdminProjectsPage() {
  const t = await getTranslations('admin.projects')
  const list = await getProjectsOverview()

  const openNeedsTotal = list.reduce((sum, p) => sum + (p.openNeeds || 0), 0)
  const newContribsTotal = list.reduce((sum, p) => sum + (p.newContributions || 0), 0)

  const stats: StatCardItem[] = [
    { icon: Rocket,      color: 'blue',  label: t('stats.total'),            value: list.length },
    { icon: Lightbulb,   color: 'green', label: t('stats.active'),           value: list.filter(p => p.isActive).length, valueColor: 'text-action' },
    { icon: Handshake,   color: 'amber', label: t('stats.openNeeds'),        value: openNeedsTotal, valueColor: 'text-warning-600' },
    { icon: AlertCircle, color: 'green', label: t('stats.newContributions'), value: newContribsTotal, valueColor: 'text-success-600' },
  ]

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Lightbulb}
      iconColor="green"
    >
      <AdminStatsGrid items={stats} />

      {list.length === 0 ? (
        <div className={cn(designPrimitive.surface.card, 'p-8 sm:p-12 text-center')}>
          <Lightbulb className="mx-auto h-12 w-12 text-text-muted dark:text-text-secondary mb-4" />
          <p className="text-sm font-semibold text-text-primary mb-1">{t('empty.title')}</p>
          <p className="text-sm text-text-tertiary">{t('empty.description')}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(p => (
            <Link
              key={p.id}
              href={ROUTES.admin.project(p.slug)}
              className={cn(
                designPrimitive.surface.card,
                'group flex flex-col p-5 transition-colors hover:border-strong dark:hover:border-white/12',
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-text-muted mb-0.5 truncate">
                    /projects/{p.slug}
                  </p>
                  <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-action dark:group-hover:text-action transition-colors">
                    {p.slug}
                  </h3>
                </div>
                {!p.isActive && (
                  <span className={cn(designPrimitive.badgeBase, 'bg-surface-raised text-text-secondary dark:bg-surface-base/6 shrink-0')}>
                    {t('card.inactive')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                <div>
                  <p className="text-text-tertiary">{t('card.openNeeds')}</p>
                  <p className="text-lg font-semibold text-text-primary">{p.openNeeds}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">{t('card.newContributions')}</p>
                  <p className={cn(
                    'text-lg font-semibold',
                    p.newContributions > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-text-primary',
                  )}>
                    {p.newContributions}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-subtle flex items-center justify-end">
                <ArrowRight className="h-3.5 w-3.5 text-text-muted dark:text-text-secondary group-hover:text-action transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  )
}
