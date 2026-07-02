import { Suspense } from 'react'
import { Metadata } from 'next'
import { getHrFunnelStats } from '@/lib/services/hr-analytics'
import { requireSection } from '@/lib/admin/guards'
import HrApplicationsPageClient from './HrApplicationsPageClient'

export const metadata: Metadata = {
  title: 'Bewerbungen',
  description: 'HR-Bewerbungs-Pipeline',
}

export default async function HrApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ job_posting_id?: string }>
}) {
  await requireSection('team')
  const params = await searchParams
  const stats = await getHrFunnelStats()

  return (
    <Suspense fallback={null}>
      <HrApplicationsPageClient stats={stats} initialPostingFilter={params.job_posting_id} />
    </Suspense>
  )
}
