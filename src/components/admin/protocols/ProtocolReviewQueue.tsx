import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, ListChecks } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PROTOCOL_STATUS_COLORS, PROTOCOL_STATUS_LABELS } from '@/config/protocols'
import { getProtocolWorkflowStep, PROTOCOL_WORKFLOW_STEPS } from '@/lib/protocols/workflow'
import type { ProtocolListItem } from '@/lib/schemas/protocols'
import { formatDateShort } from '@/lib/date-formats'
import { adminSurface, adminType } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader'
import { ROUTES } from '@/config/routes'

interface ProtocolReviewQueueProps {
  protocols: ProtocolListItem[]
}

function getWorkflowLabel(protocol: ProtocolListItem) {
  const stepId = getProtocolWorkflowStep({
    status: protocol.status,
    hasStructuredNotes: protocol.has_structured_notes,
    unlinkedTaskCount: protocol.unlinked_action_item_count,
  })
  return PROTOCOL_WORKFLOW_STEPS.find((step) => step.id === stepId)?.label ?? 'Review'
}

export async function ProtocolReviewQueue({ protocols }: ProtocolReviewQueueProps) {
  const t = await getTranslations('admin.protocols')
  const hasItems = protocols.length > 0

  return (
    <section className={cn(adminSurface.card, 'p-5')}>
      <AdminSectionHeader
        title={t('queueTitle')}
        description={t('queueDescription')}
        icon={ListChecks}
        actions={
          <AdminButton href={ROUTES.admin.protocolNew} variant="primary">
            <FileText className="w-4 h-4" />
            {t('newProtocol')}
          </AdminButton>
        }
      />

      {!hasItems ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-900/20 p-4 text-primary-900 dark:text-primary-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-action" />
          <div>
            <p className={cn(adminType.body, 'font-medium text-primary-900 dark:text-primary-300')}>{t('noPendingReviews')}</p>
            <p className="mt-1 text-base text-primary-800 dark:text-primary-300">
              {t('noPendingDescription')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {protocols.map((protocol) => {
            const needsTasks = protocol.unlinked_action_item_count > 0
            return (
              <article
                key={protocol.id}
                className="rounded-lg border border bg-surface-base p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-900/20"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', PROTOCOL_STATUS_COLORS[protocol.status])}>
                        {PROTOCOL_STATUS_LABELS[protocol.status]}
                      </span>
                      <span className="inline-flex rounded-full bg-surface-raised px-3 py-1 text-sm font-medium text-text-secondary">
                        {getWorkflowLabel(protocol)}
                      </span>
                      {needsTasks && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 dark:bg-warning-900/30 px-3 py-1 text-sm font-medium text-warning-800 dark:text-warning-200">
                          <AlertCircle className="h-4 w-4" />
                          {protocol.unlinked_action_item_count} {t('open')}
                        </span>
                      )}
                    </div>
                    <Link
                      href={ROUTES.admin.protocol(protocol.id)}
                      className="block truncate text-lg font-semibold text-neutral-950 underline-offset-2 hover:text-primary-700 hover:underline"
                    >
                      {protocol.title}
                    </Link>
                    <p className="mt-1 text-base text-text-secondary">
                      {formatDateShort(protocol.meeting_date)}
                      {protocol.created_by_name ? ` · ${t('by')} ${protocol.created_by_name}` : ''}
                    </p>
                    <p className="mt-2 text-base text-text-secondary">
                      {protocol.action_item_count} {t('recognizedActions')}
                      {needsTasks ? `, ${protocol.unlinked_action_item_count} ${t('notInTaskSystem')}` : `, ${t('readyToClose')}`}
                    </p>
                  </div>

                  <AdminButton href={ROUTES.admin.protocol(protocol.id)} variant={needsTasks ? 'action' : 'secondary'} className="md:mt-1">
                    {t('openReview')}
                    <ArrowRight className="h-4 w-4" />
                  </AdminButton>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
