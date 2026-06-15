/**
 * Admin Tasks Page - Server Component
 *
 * Orchestration only — data layer in ./data.ts, table in ./TaskTable.tsx.
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { Suspense } from 'react'
import { logger } from '@/lib/logger'
import { TASK_STATUSES, TASK_LIST_FILTERS } from '@/config/tasks'
import type { TaskListItem } from '@/lib/schemas/tasks'
import {
  Plus,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import TaskFiltersClient from './TaskFiltersClient'
import { Pagination } from '@/components/ui/Pagination'
import { ROUTES } from '@/config/routes'
import {
  TASKS_PAGE_SIZE,
  getTaskStats,
  getTasks,
  buildTasksHrefBase,
} from './data'
import { TaskTable } from './TaskTable'

export const metadata: Metadata = {
  title: 'Aufgaben',
  description: 'Teamaufgaben verwalten und koordinieren.',
}

export default async function TasksAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string; priority?: string; page?: string }>
}) {
  const t = await getTranslations('admin.tasks')
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const stats = await getTaskStats()

  let tasks: TaskListItem[] = []
  let totalTasks = 0
  let listError = false
  try {
    const result = await getTasks({
      category: params.category,
      status: params.status,
      q: params.q,
      priority: params.priority,
      page: currentPage,
    })
    tasks = result.rows
    totalTasks = result.total
  } catch (error) {
    logger.error('Error fetching tasks', { error })
    listError = true
  }

  const totalPages = Math.ceil(totalTasks / TASKS_PAGE_SIZE)
  const tasksHrefBase = buildTasksHrefBase(ROUTES.admin.tasks, {
    category: params.category,
    status: params.status,
    q: params.q,
    priority: params.priority,
  })

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={ClipboardList}
      iconColor="blue"
      actions={
        <Link href={ROUTES.admin.taskNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          <Plus className="w-4 h-4" />
          Neue Aufgabe
        </Link>
      }
    >
      <AdminStatsGrid items={[
        {
          icon: ClipboardList,
          color: 'gray',
          label: 'Gesamt',
          value: stats.total,
          href: `${ROUTES.admin.tasks}?status=${TASK_LIST_FILTERS.ALL}`,
        },
        {
          icon: AlertTriangle,
          color: 'red',
          label: 'Braucht Aufmerksamkeit',
          value: stats.needsAttention,
          valueColor: 'text-error-600',
          href: `${ROUTES.admin.tasks}?status=${TASK_STATUSES.NEEDS_ATTENTION}`,
        },
        {
          icon: Clock,
          color: 'amber',
          label: 'Angefragt',
          value: stats.requested,
          valueColor: 'text-warning-600',
          href: `${ROUTES.admin.tasks}?status=${TASK_STATUSES.REQUESTED}`,
        },
        {
          icon: CheckCircle2,
          color: 'green',
          label: 'Heute erledigt',
          value: stats.completedToday,
          valueColor: 'text-action',
        },
      ] satisfies StatCardItem[]} />

      <Suspense fallback={<div className="bg-surface-base rounded-lg border p-4 h-14" />}>
        <TaskFiltersClient />
      </Suspense>

      <div className="bg-surface-base rounded-lg border overflow-hidden overflow-x-auto">
        <TaskTable tasks={tasks} hasError={listError} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalTasks}
          pageSize={TASKS_PAGE_SIZE}
          hrefBase={tasksHrefBase}
        />
      </div>
    </AdminPageWrapper>
  )
}
