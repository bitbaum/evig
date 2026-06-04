import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { taskProjects, tasks, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/config/tasks'
import type { ProjectStatus } from '@/config/tasks'
import { ROUTES } from '@/config/routes'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { FolderKanban, Plus, Clock, Calendar } from 'lucide-react'

const STATUS_BADGE: Record<ProjectStatus, string> = {
  planning:  'bg-surface-raised text-text-secondary dark:bg-white/6',
  active:    'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-400',
  on_hold:   'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-400',
  completed: 'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-400',
  cancelled: 'bg-error-100 text-error-800 dark:bg-error-500/15 dark:text-error-400',
} as const

async function getProject(id: string) {
  try {
    const [row] = await db
      .select({
        id: taskProjects.id,
        title: taskProjects.title,
        description: taskProjects.description,
        status: taskProjects.status,
        targetDate: taskProjects.targetDate,
        createdAt: taskProjects.createdAt,
        createdByName: users.name,
      })
      .from(taskProjects)
      .leftJoin(users, eq(taskProjects.createdBy, users.id))
      .where(eq(taskProjects.id, id))
    return row ?? null
  } catch (error) {
    logger.error('Error fetching project detail', { error, id })
    return null
  }
}

async function getProjectTasks(id: string) {
  try {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        category: tasks.category,
        priority: tasks.priority,
        currentStatus: tasks.currentStatus,
        isCompleted: tasks.isCompleted,
        dueDate: tasks.dueDate,
        assignedToName: users.name,
        completionCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${sql.raw(TABLE_NAMES.TASK_COMPLETIONS)} tc WHERE tc.task_id = ${tasks.id}
        )`,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(sql`${tasks.projectId} = ${id} AND NOT ${tasks.isArchived}`)
      .orderBy(sql`${tasks.createdAt} DESC`)
  } catch (error) {
    logger.error('Error fetching project tasks', { error, id })
    return []
  }
}

export default async function TaskProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, projectTasks] = await Promise.all([
    getProject(id),
    getProjectTasks(id),
  ])

  if (!project) notFound()

  const completedCount = projectTasks.filter(t => t.isCompleted).length
  const progress = projectTasks.length > 0
    ? Math.round((completedCount / projectTasks.length) * 100)
    : 0

  return (
    <AdminPageWrapper
      title={project.title}
      description={project.description ?? 'Aufgaben-Projekt'}
      icon={FolderKanban}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.taskProjects, label: 'Projekte' }}
      actions={
        <Link
          href={`${ROUTES.admin.taskNew}?project=${id}`}
          className={cn(
            designPrimitive.buttonBase,
            designPrimitive.buttonSize.default,
            designPrimitive.button.primary,
            'gap-1.5'
          )}
        >
          <Plus className="h-4 w-4" />
          Aufgabe hinzufügen
        </Link>
      }
    >
      {/* Project meta card */}
      <div className={cn(designPrimitive.surface.card, 'p-5')}>
        <div className="flex flex-wrap items-center gap-4">
          <span className={cn(
            designPrimitive.badgeBase,
            STATUS_BADGE[project.status as ProjectStatus] ?? 'bg-surface-raised text-text-secondary'
          )}>
            {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
          </span>
          {project.targetDate && (
            <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <Calendar className="h-3.5 w-3.5" />
              Zieldatum: {formatDateShort(project.targetDate)}
            </span>
          )}
          {project.createdAt && (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              Erstellt: {formatDateShort(project.createdAt)}
              {project.createdByName && ` · ${project.createdByName}`}
            </span>
          )}
        </div>

        {/* Progress */}
        {projectTasks.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-tertiary">
                {completedCount}/{projectTasks.length} Aufgaben erledigt
              </span>
              <span className="text-xs font-semibold text-text-secondary">
                {progress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-raised dark:bg-white/6">
              <div
                className="h-2 rounded-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasks table */}
      {projectTasks.length === 0 ? (
        <div className={cn(designPrimitive.surface.card, 'p-10 text-center')}>
          <FolderKanban className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm font-semibold text-text-primary mb-1">Noch keine Aufgaben</p>
          <p className="text-sm text-text-tertiary mb-4">
            Füge Aufgaben zu diesem Projekt hinzu.
          </p>
          <Link
            href={`${ROUTES.admin.taskNew}?project=${id}`}
            className={cn(
              designPrimitive.buttonBase,
              designPrimitive.buttonSize.default,
              designPrimitive.button.primary
            )}
          >
            <Plus className="h-4 w-4" />
            Aufgabe hinzufügen
          </Link>
        </div>
      ) : (
        <div className={cn(designPrimitive.surface.table, 'overflow-x-auto')}>
          <table className="w-full">
            <thead className={designPrimitive.table.thead}>
              <tr>
                <th className={designPrimitive.table.th}>Aufgabe</th>
                <th className={cn(designPrimitive.table.th, 'hidden sm:table-cell')}>Status</th>
                <th className={cn(designPrimitive.table.th, 'hidden sm:table-cell')}>Priorität</th>
                <th className={cn(designPrimitive.table.th, 'hidden md:table-cell')}>Zugewiesen</th>
                <th className={cn(designPrimitive.table.th, 'hidden md:table-cell text-right')}>Erledigungen</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.map(task => (
                <tr key={task.id} className={designPrimitive.table.tr}>
                  <td className={cn(designPrimitive.table.td, 'max-w-xs')}>
                    <Link
                      href={ROUTES.admin.task(task.id)}
                      className="font-medium text-text-primary hover:text-primary-600 dark:hover:text-primary-400 truncate block transition-colors"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-xs text-text-muted truncate">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className={cn(designPrimitive.table.td, 'hidden sm:table-cell whitespace-nowrap')}>
                    <span className={cn(
                      designPrimitive.badgeBase,
                      TASK_STATUS_COLORS[task.currentStatus as keyof typeof TASK_STATUS_COLORS] ?? 'bg-surface-raised text-text-secondary'
                    )}>
                      {TASK_STATUS_LABELS[task.currentStatus as keyof typeof TASK_STATUS_LABELS] ?? task.currentStatus}
                    </span>
                  </td>
                  <td className={cn(designPrimitive.table.td, 'hidden sm:table-cell whitespace-nowrap')}>
                    <span className={cn(
                      designPrimitive.badgeBase,
                      TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS] ?? 'bg-surface-raised text-text-secondary'
                    )}>
                      {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}
                    </span>
                  </td>
                  <td className={cn(designPrimitive.table.td, 'hidden md:table-cell whitespace-nowrap')}>
                    {task.assignedToName ? (
                      <span>{task.assignedToName}</span>
                    ) : (
                      <span className="text-neutral-300 dark:text-neutral-600">&mdash;</span>
                    )}
                  </td>
                  <td className={cn(designPrimitive.table.td, 'hidden md:table-cell text-right whitespace-nowrap')}>
                    {task.completionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageWrapper>
  )
}
