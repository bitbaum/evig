import { Link } from '@/i18n/navigation'
import { CheckSquare, FileText, Calendar, AlertCircle, ArrowRight } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@/config/routes'
import { adminInteractive } from '@/lib/admin-ui'
import { getPersonalSectionData, TASK_LIMIT, SUBMISSION_LIMIT } from '@/lib/dashboard/personal-section'

interface PersonalSectionProps {
  userId: string
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

export async function PersonalSection({ userId }: PersonalSectionProps) {
  const t = await getTranslations('admin.dashboard')

  function contentTypeLabel(type: string | null): string {
    switch (type) {
      case 'blog_post': return t('contentTypeLabels.blogPost')
      case 'workshop': return t('contentTypeLabels.workshop')
      case 'service': return t('contentTypeLabels.service')
      default: return t('contentTypeLabels.other')
    }
  }

  const { myTasks, mySubmissions } = await getPersonalSectionData(userId)

  if (myTasks.length === 0 && mySubmissions.length === 0) return null

  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle">
      <div className="p-4 border-b border-subtle flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-action shrink-0" aria-hidden="true" />
        <Heading level={2} className="font-semibold text-text-primary">
          {t('myTasks')}
        </Heading>
      </div>

      <div className="p-4 space-y-5">
        {/* My assigned tasks */}
        {myTasks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              {t('assignedTasks')}
            </p>
            <ul className="space-y-2" role="list">
              {myTasks.map(task => {
                const overdue = taskIsOverdue(task.due_date)
                const dueDateText = formatDueDate(task.due_date)

                return (
                  <li key={task.id}>
                    <Link
                      href={`${ROUTES.admin.tasks}?highlight=${task.id}`}
                      className={`flex items-start gap-3 p-3 rounded-lg bg-surface-raised ${adminInteractive.rowHover} transition-colors group`}
                    >
                      {overdue ? (
                        <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <Calendar className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary leading-snug">
                          {task.title}
                        </p>
                        {dueDateText && (
                          <p className={`text-sm mt-0.5 ${overdue ? 'text-error-600 dark:text-error-400' : 'text-text-tertiary'}`}>
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
                href={ROUTES.admin.tasks}
                className="flex items-center gap-1 mt-2 px-3 py-2 text-sm text-action hover:text-action hover:bg-action-muted rounded-lg transition-colors"
              >
                {t('viewAllTasks')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {/* My pending content submissions */}
        {mySubmissions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              {t('submittedContent')}
            </p>
            <ul className="space-y-2" role="list">
              {mySubmissions.map(sub => (
                <li key={sub.id}>
                  <Link
                    href={ROUTES.admin.approvals}
                    className={`flex items-start gap-3 p-3 rounded-lg bg-surface-raised ${adminInteractive.rowHover} transition-colors`}
                  >
                    <FileText className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary leading-snug">
                        {sub.title ?? contentTypeLabel(sub.content_type)}
                      </p>
                      <p className="text-sm text-warning-600 dark:text-warning-400 mt-0.5">
                        {contentTypeLabel(sub.content_type)} · {t('awaitingApproval')}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {mySubmissions.length === SUBMISSION_LIMIT && (
              <Link
                href={ROUTES.admin.approvals}
                className="flex items-center gap-1 mt-2 px-3 py-2 text-sm text-warning-600 dark:text-warning-400 hover:text-warning-700 dark:hover:text-warning-300 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors"
              >
                {t('viewAllSubmissions')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
