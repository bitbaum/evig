import { Metadata } from 'next'
import HrApplicationsPageClient from './HrApplicationsPageClient'

export const metadata: Metadata = {
  title: 'Bewerbungen',
  description: 'HR-Bewerbungs-Pipeline',
}

export default function HrApplicationsPage() {
  return <HrApplicationsPageClient />
}
