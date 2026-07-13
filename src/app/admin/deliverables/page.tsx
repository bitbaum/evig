import { Metadata } from 'next'
import Link from 'next/link'
import { PackageCheck, Plus, MessageSquare } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { buttonClass } from '@/components/ui/button-class'
import { ROUTES } from '@/config/routes'
import { listDeliverables } from '@/lib/services/deliverables'
import type { DeliverableListItem } from '@/lib/schemas/deliverables'
import {
  DELIVERABLE_TYPE_LABELS,
  DELIVERABLE_STATUS_LABELS,
  DELIVERABLE_STATUS_COLORS,
  type DeliverableType,
  type DeliverableStatus,
} from '@/config/deliverables'
import { formatDateNumeric } from '@/lib/date-formats'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
  title: 'Liefergegenstände',
  description: 'Berichte, Präsentationen und Mockups teilen und Feedback sammeln.',
}

export default async function DeliverablesAdminPage() {
  let rows: DeliverableListItem[] = []
  let listError = false
  try {
    rows = await listDeliverables()
  } catch (error) {
    logger.error('Error loading deliverables list', { error })
    listError = true
  }

  return (
    <AdminPageWrapper
      title="Liefergegenstände"
      description="Berichte, Präsentationen und Mockups — teilen und Feedback sammeln."
      icon={PackageCheck}
      iconColor="gray"
      actions={
        <Link href={ROUTES.admin.deliverableNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          <Plus className="w-4 h-4" />
          Neuer Liefergegenstand
        </Link>
      }
    >
      {listError ? (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300">
          Fehler beim Laden der Liefergegenstände.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-surface-base rounded-lg border p-10 text-center">
          <PackageCheck className="w-10 h-10 mx-auto text-text-secondary mb-3" />
          <p className="text-text-primary font-medium">Noch keine Liefergegenstände</p>
          <p className="text-text-secondary text-sm mt-1">
            Erfasse einen Bericht, eine Präsentation oder ein Mockup und teile ihn mit dem Team.
          </p>
          <Link
            href={ROUTES.admin.deliverableNew}
            className={buttonClass({ variant: 'primary', size: 'sm' }) + ' mt-4 inline-flex'}
          >
            <Plus className="w-4 h-4" />
            Neuer Liefergegenstand
          </Link>
        </div>
      ) : (
        <div className="bg-surface-base rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-surface-raised text-text-secondary text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Titel</th>
                  <th className="px-4 py-3 font-medium">Typ</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Autor</th>
                  <th className="px-4 py-3 font-medium">Aktualisiert</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-raised transition-colors">
                    <td className="px-4 py-3">
                      <Link href={ROUTES.admin.deliverable(d.id)} className="font-medium text-text-primary hover:text-action">
                        {d.title}
                      </Link>
                      {d.open_feedback_count > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-700">
                          <MessageSquare className="w-3 h-3" />
                          {d.open_feedback_count} offen
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {DELIVERABLE_TYPE_LABELS[d.type as DeliverableType] ?? d.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${DELIVERABLE_STATUS_COLORS[d.status as DeliverableStatus] ?? ''}`}>
                        {DELIVERABLE_STATUS_LABELS[d.status as DeliverableStatus] ?? d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{d.owner_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDateNumeric(d.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}
