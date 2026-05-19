/**
 * Admin Task Projects Page
 *
 * Lists all task-projects with task counts, status, and quick actions.
 * Task-projects group related tasks into organizational units.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/db'
import { taskProjects, tasks, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
} from '@/config/tasks'
import type { ProjectStatus } from '@/config/tasks'
import { ROUTES } from '@/config/routes'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Clock,
  PauseCircle,
  Circle,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Projekte',
  description: 'Aufgaben-Projekte verwalten und überblicken.',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning:  'bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300',
  active:    'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-400',
  on_hold:   'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-400',
  completed: 'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-400',
  cancelled: 'bg-error-100 text-error-800 dark:bg-error-500/15 dark:text-error-400',
} as const

async function getProjects() {
  try {
    return await db
      .select({
        id: taskProjects.id,
        title: taskProjects.title,
        description: taskProjects.description,
        status: taskProjects.status,
        targetDate: taskProjects.targetDate,
        createdAt: taskProjects.createdAt,
        createdByName: users.name,
        taskCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${tasks} t
          WHERE t.project_id = ${taskProjects.id} AND NOT t.is_archived
        )`,
        completedTaskCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${tasks} t
          WHERE t.project_id = ${taskProjects.id} AND t.is_completed AND NOT t.is_archived
        )`,
      })
      .from(taskProjects)
      .leftJoin(users, eq(taskProjects.createdBy, users.id))
      .orderBy(
        sql`CASE ${taskProjects.status}
          WHEN ${PROJECT_STATUSES.ACTIVE} THEN 0
          WHEN ${PROJECT_STATUSES.PLANNING} THEN 1
          WHEN ${PROJECT_STATUSES.ON_HOLD} THEN 2
          WHEN ${PROJECT_STATUSES.COMPLETED} THEN 3
          WHEN ${PROJECT_STATUSES.CANCELLED} THEN 4
        END`,
        sql`${taskProjects.createdAt} DESC`
      )
  } catch (error) {
    logger.error('Error fetching task projects', { error })
    return []
  }
}

export default async function TaskProjectsPage() {
  const projects = await getProjects()

  const total = projects.length
  const active = projects.filter(p => p.status === PROJECT_STATUSES.ACTIVE).length
  const completed = projects.filter(p => p.status === PROJECT_STATUSES.COMPLETED).length
  const onHold = projects.filter(p => p.status === PROJECT_STATUSES.ON_HOLD).length

  const stats: StatCardItem[] = [
    { icon: FolderKanban, color: 'gray',  label: 'Gesamt',          value: total },
    { icon: BarChart3,    color: 'green', label: 'Aktiv',           value: active,    valueColor: 'text-primary-600' },
    { icon: PauseCircle,  color: 'amber', label: 'Pausiert',        value: onHold,    valueColor: 'text-warning-600' },
    { icon: CheckCircle2, color: 'green', label: 'Abgeschlossen',   value: completed, valueColor: 'text-success-600' },
  ]

  return (
    <AdminPageWrapper
      title="Projekte"
      description="Aufgaben in Projekte gruppieren und den Überblick behalten"
      icon={FolderKanban}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.tasks, label: 'Aufgaben' }}
      actions={
        <Link
          href={ROUTES.admin.taskProjectNew}
          className={cn(
            designPrimitive.buttonBase,
            designPrimitive.buttonSize.default,
            designPrimitive.button.primary,
            'gap-1.5'
          )}
        >
          <Plus className="h-4 w-4" />
          Neues Projekt
        </Link>
      }
    >
      <AdminStatsGrid items={stats} />

      {projects.length === 0 ? (
        <div className={cn(designPrimitive.surface.card, 'p-12 text-center')}>
          <FolderKanban className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
            Noch keine Projekte
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Erstelle ein Projekt, um Aufgaben zu gruppieren und den Überblick zu behalten.
          </p>
          <Link
            href={ROUTES.admin.taskProjectNew}
            className={cn(
              designPrimitive.buttonBase,
              designPrimitive.buttonSize.default,
              designPrimitive.button.primary
            )}
          >
            <Plus className="h-4 w-4" />
            Erstes Projekt erstellen
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress = project.taskCount > 0
              ? Math.round((project.completedTaskCount / project.taskCount) * 100)
              : 0

            return (
              <Link
                key={project.id}
                href={ROUTES.admin.taskProject(project.id)}
                className={cn(
                  designPrimitive.surface.card,
                  'group flex flex-col p-5 transition-colors hover:border-neutral-300 dark:hover:border-white/[0.12]'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FolderKanban className="h-4 w-4 flex-shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {project.title}
                    </span>
                  </div>
                  <span className={cn(
                    designPrimitive.badgeBase,
                    'whitespace-nowrap',
                    STATUS_COLORS[project.status as ProjectStatus] ?? 'bg-neutral-100 text-neutral-700'
                  )}>
                    {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                {project.taskCount > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {project.completedTaskCount}/{project.taskCount} Aufgaben
                      </span>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-white/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-primary-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/[0.04]">
                  <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                    {project.targetDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateShort(project.targetDate)}
                      </span>
                    )}
                    {project.taskCount === 0 && (
                      <span className="flex items-center gap-1">
                        <Circle className="h-3.5 w-3.5" />
                        Keine Aufgaben
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </AdminPageWrapper>
  )
}
