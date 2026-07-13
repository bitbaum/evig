import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { getDeliverable, getFeedback } from '@/lib/services/deliverables'
import DeliverableReviewClient from './DeliverableReviewClient'

export const metadata: Metadata = {
  title: 'Liefergegenstand',
}

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deliverable = await getDeliverable(id)
  if (!deliverable) notFound()

  const feedback = await getFeedback(id)

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
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5 text-action" />
          </div>
          <div className="min-w-0">
            <Heading level={1} className="text-2xl font-bold text-text-primary truncate">{deliverable.title}</Heading>
            <p className="text-text-secondary truncate">
              {deliverable.owner_name ? `von ${deliverable.owner_name}` : 'Liefergegenstand'}
            </p>
          </div>
        </div>
      </div>

      <DeliverableReviewClient deliverable={deliverable} initialFeedback={feedback} />
    </div>
  )
}
