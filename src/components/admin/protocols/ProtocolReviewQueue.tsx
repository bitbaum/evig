import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, ListChecks } from 'lucide-react'
import { PROTOCOL_STATUS_COLORS, PROTOCOL_STATUS_LABELS } from '@/config/protocols'
import { getProtocolWorkflowStep, PROTOCOL_WORKFLOW_STEPS } from '@/lib/protocols/workflow'
import type { ProtocolListItem } from '@/lib/schemas/protocols'
import { formatDateShort } from '@/lib/date-formats'
import { adminSurface, adminType } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader'

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

export function ProtocolReviewQueue({ protocols }: ProtocolReviewQueueProps) {
  const hasItems = protocols.length > 0

  return (
    <section className={cn(adminSurface.card, 'p-5')}>
      <AdminSectionHeader
        title="AI Review Queue"
        description="KI-Ergebnisse prüfen, daraus Aufgaben und Entscheidungen erzeugen, dann abschliessen."
        icon={ListChecks}
        actions={
          <AdminButton href="/admin/protocols/new" variant="primary">
            <FileText className="w-4 h-4" />
            Neues Protokoll
          </AdminButton>
        }
      />

      {!hasItems ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4 text-primary-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
          <div>
            <p className={cn(adminType.body, 'font-medium text-primary-900')}>Keine Protokolle warten auf Review.</p>
            <p className="mt-1 text-base text-primary-800">
              Neue Transkripte oder Notizen erscheinen hier, sobald die KI sie strukturiert hat.
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
                className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-info-300 hover:bg-info-50/40"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', PROTOCOL_STATUS_COLORS[protocol.status])}>
                        {PROTOCOL_STATUS_LABELS[protocol.status]}
                      </span>
                      <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                        {getWorkflowLabel(protocol)}
                      </span>
                      {needsTasks && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-3 py-1 text-sm font-medium text-warning-800">
                          <AlertCircle className="h-4 w-4" />
                          {protocol.unlinked_action_item_count} offen
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/admin/protocols/${protocol.id}`}
                      className="block truncate text-lg font-semibold text-neutral-950 underline-offset-2 hover:text-info-700 hover:underline"
                    >
                      {protocol.title}
                    </Link>
                    <p className="mt-1 text-base text-neutral-600">
                      {formatDateShort(protocol.meeting_date)}
                      {protocol.created_by_name ? ` · von ${protocol.created_by_name}` : ''}
                    </p>
                    <p className="mt-2 text-base text-neutral-700">
                      {protocol.action_item_count} erkannte Aktionen
                      {needsTasks ? `, ${protocol.unlinked_action_item_count} noch nicht im Aufgaben-System` : ', bereit zum Abschluss'}
                    </p>
                  </div>

                  <AdminButton href={`/admin/protocols/${protocol.id}`} variant={needsTasks ? 'action' : 'secondary'} className="md:mt-1">
                    Review öffnen
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
