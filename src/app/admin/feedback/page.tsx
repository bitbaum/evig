/**
 * Admin: Website feedback
 *
 * The submissions from the floating feedback widget on public pages
 * (SuggestionButton → /api/suggestions). Persisted so nothing is lost when
 * email delivery fails.
 */

import { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/db'
import { siteSuggestions } from '@/db/schema'
import { requireAnySection } from '@/lib/admin/guards'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { SiteFeedbackList } from './SiteFeedbackList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Website-Feedback',
  description: 'Rückmeldungen von Besucher:innen der Website',
}

export default async function SiteFeedbackPage() {
  await requireAnySection(['presentations', 'content'], 'content')

  const rows = await db
    .select()
    .from(siteSuggestions)
    .orderBy(asc(siteSuggestions.resolved), desc(siteSuggestions.createdAt))

  const openCount = rows.filter(r => !r.resolved).length

  return (
    <AdminPageWrapper
      title="Website-Feedback"
      description={`${openCount} offene${openCount === 1 ? 's' : ''} Feedback${openCount === 1 ? '' : 's'} von Besucher:innen`}
      icon={MessageSquare}
      iconColor="blue"
    >
      <SiteFeedbackList items={rows} />
    </AdminPageWrapper>
  )
}
