import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import DeliverableFormClient from './DeliverableFormClient'

export const metadata: Metadata = {
  title: 'Neuer Liefergegenstand',
  description: 'Einen Bericht, eine Präsentation oder ein Mockup erfassen.',
}

export default function NewDeliverablePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.admin.deliverables}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-surface-overlay" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
            <PackageCheck className="w-5 h-5 text-action" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">Neuer Liefergegenstand</Heading>
            <p className="text-text-secondary">Erfasse ein Arbeitsergebnis und teile es mit dem Team</p>
          </div>
        </div>
      </div>

      <DeliverableFormClient />
    </div>
  )
}
