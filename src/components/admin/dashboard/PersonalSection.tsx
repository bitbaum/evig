import Link from 'next/link'
import { CheckSquare, FileText, Calendar, AlertCircle } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

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
      LIMIT 5
    `),
    db.execute(sql`
      SELECT id, content_type, title, status, created_at
      FROM ${sql.raw(TABLE_NAMES.USER_CONTENT_SUBMISSIONS)}
      WHERE user_id = ${userId}
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 5
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
        status: String(r.status ?? 'pending'),
        created_at: String(r.created_at ?? ''),
      }))
    : (() => { logger.warn('PersonalSection submissions query failed', { error: (submissionsResult as PromiseRejectedResult).reason }); return [] })()

  // Hide entirely when there's nothing personal to show
  if (myTasks.length === 0 && mySubmissions.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-gray-900 dark:text-white">
          Meine Aufgaben
        </Heading>
      </div>

      <div className="p-4 space-y-5">
        {/* My assigned tasks */}
        {myTasks.length > 0 && (
          <div>
            {myTasks.length > 1 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Zugewiesene Aufgaben
              </p>
            )}
            <ul className="space-y-1.5" role="list">
              {myTasks.map(task => {
                const overdue = taskIsOverdue(task.due_date)
                const dueDateText = formatDueDate(task.due_date)

                return (
                  <li key={task.id}>
                    <Link
                      href={`/admin/tasks?highlight=${task.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      {overdue ? (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white leading-snug">
                          {task.title}
                        </p>
                        {dueDateText && (
                          <p className={`text-sm mt-0.5 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {dueDateText}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {myTasks.length === 5 && (
              <Link
                href="/admin/tasks"
                className="block mt-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                Alle Aufgaben ansehen →
              </Link>
            )}
          </div>
        )}

        {/* My pending content submissions */}
        {mySubmissions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              Eingereichte Inhalte
            </p>
            <ul className="space-y-1.5" role="list">
              {mySubmissions.map(sub => (
                <li key={sub.id}>
                  <Link
                    href="/admin/approvals"
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white leading-snug">
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
          </div>
        )}
      </div>
    </div>
  )
}
