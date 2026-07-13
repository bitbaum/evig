/**
 * Admin: Presentation feedback
 *
 * Collects the per-slide comments readers leave on shared decks (see
 * /api/presentations/comments). Grouped by deck → slide, with a
 * "copy as prompt" button so staff can paste the feedback straight to the AI
 * to fix the slides.
 */

import { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/db'
import { presentationComments } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'
import { PRESENTATION_DECKS } from '@/config/presentations'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { FeedbackList } from './FeedbackList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Präsentations-Feedback',
  description: 'Kommentare zu den Präsentationsfolien',
}

export default async function PresentationFeedbackPage() {
  await requireAnySection(['presentationFeedback', 'presentations', 'content'], 'presentations')

  const rows = await db
    .select()
    .from(presentationComments)
    .orderBy(asc(presentationComments.resolved), desc(presentationComments.createdAt))

  const decks = PRESENTATION_DECKS.map(d => ({ slug: d.slug, title: d.title }))
  const openCount = rows.filter(r => !r.resolved).length

  return (
    <AdminPageWrapper
      title="Präsentations-Feedback"
      description={`${openCount} offene${openCount === 1 ? 'r' : ''} Kommentar${openCount === 1 ? '' : 'e'} von Leser:innen`}
      icon={MessageSquare}
      iconColor="blue"
    >
      <FeedbackList comments={rows} decks={decks} />
    </AdminPageWrapper>
  )
}
