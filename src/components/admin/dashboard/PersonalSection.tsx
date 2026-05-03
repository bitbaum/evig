import { Link } from '@/i18n/navigation'
import { CheckSquare, FileText, Calendar, AlertCircle, ArrowRight } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { APPROVAL_STATUS } from '@/config/approval-status'

interface PersonalSectionProps {
  userId: string
}

interface MyTask {
  id: string
  title: string
  due_date: string | null
  priority: string | null
}

interface MySubmission {
  id: string
  content_type: string | null
  title: string | null
  status: string
  created_at: string
}

// Single source of truth for both the SQL LIMIT and the "view all" threshold
const TASK_LIMIT = 5
const SUBMISSION_LIMIT = 5

function taskIsOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)} Tag${Math.abs(diff) !== 1 ? 'e' : ''} überfällig`
  if (diff === 0) return 'heute fällig'
  if (diff === 1) return 'morgen fällig'
  return `fällig in ${diff} Tagen`
}

function contentTypeLabel(type: string | null): string {
  switch (type) {
    case 'blog_post': return 'Blogartikel'
    case 'workshop': return 'Workshop'
    case 'service': return 'Dienstleistung'
    default: return 'Einreichung'
  }
}

export async function PersonalSection({ userId }: PersonalSectionProps) {
  type Row = Record<string, unknown>

  const [tasksResult, submissionsResult] = await Promise.allSettled([
    db.execute(sql`
      SELECT id, title, due_date, priority
      FROM ${sql.raw(TABLE_NAMES.TASKS)}
      WHERE assigned_to = ${userId}
        AND is_completed = false
        AND is_archived = false
      ORDER BY due_date ASC NULLS LAST, priority DESC
      LIMIT ${TASK_LIMIT}
    `),
    db.execute(sql`
      SELECT id, content_type, title, status, created_at
      FROM ${sql.raw(TABLE_NAMES.USER_CONTENT_SUBMISSIONS)}
      WHERE user_id = ${userId}
        AND status = ${APPROVAL_STATUS.PENDING}
      ORDER BY created_at DESC
      LIMIT ${SUBMISSION_LIMIT}
    `),
  ])

  const myTasks: MyTask[] = tasksResult.status === 'fulfilled'
    ? (tasksResult.value.rows as Row[]).map(r => ({
        id: String(r.id ?? ''),
        title: String(r.title ?? ''),
        due_date: r.due_date ? String(r.due_date) : null,
        priority: r.priority ? String(r.priority) : null,
      }))
    : (() => { logger.warn('PersonalSection tasks query failed', { error: (tasksResult as PromiseRejectedResult).reason }); return [] })()

  const mySubmissions: MySubmission[] = submissionsResult.status === 'fulfilled'
    ? (submissionsResult.value.rows as Row[]).map(r => ({
        id: String(r.id ?? ''),
        content_type: r.content_type ? String(r.content_type) : null,
        title: r.title ? String(r.title) : null,
        status: String(r.status ?? APPROVAL_STATUS.PENDING),
        created_at: String(r.created_at ?? ''),
      }))
    : (() => { logger.warn('PersonalSection submissions query failed', { error: (submissionsResult as PromiseRejectedResult).reason }); return [] })()

  if (myTasks.length === 0 && mySubmissions.length === 0) return null

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-neutral-900 dark:text-white">
          Meine Aufgaben
        </Heading>
      </div>

      <div className="p-4 space-y-5">
        {/* My assigned tasks */}
        {myTasks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
              Zugewiesene Aufgaben
            </p>
            <ul className="space-y-2" role="list">
              {myTasks.map(task => {
                const overdue = taskIsOverdue(task.due_date)
                const dueDateText = formatDueDate(task.due_date)

                return (
                  <li key={task.id}>
                    <Link
                      href={`/admin/tasks?highlight=${task.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
                    >
                      {overdue ? (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 dark:text-white leading-snug">
                          {task.title}
                        </p>
                        {dueDateText && (
                          <p className={`text-sm mt-0.5 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {dueDateText}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {myTasks.length === TASK_LIMIT && (
              <Link
                href="/admin/tasks"
                className="flex items-center gap-1 mt-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Alle Aufgaben ansehen
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {/* My pending content submissions */}
        {mySubmissions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
              Eingereichte Inhalte
            </p>
            <ul className="space-y-2" role="list">
              {mySubmissions.map(sub => (
                <li key={sub.id}>
                  <Link
                    href="/admin/approvals"
                    className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white leading-snug">
                        {sub.title ?? contentTypeLabel(sub.content_type)}
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                        {contentTypeLabel(sub.content_type)} · wartet auf Freigabe
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {mySubmissions.length === SUBMISSION_LIMIT && (
              <Link
                href="/admin/approvals"
                className="flex items-center gap-1 mt-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              >
                Alle Einreichungen ansehen
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
