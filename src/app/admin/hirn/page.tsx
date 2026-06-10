/**
 * Admin Hirn Page - Server Component (auth gate)
 *
 * Belt-and-suspenders page-level access check for the sensitive `hirn`
 * section (AI chat assistant — can be configured to expose org data via
 * future tools). Layout-level sidebar filtering already hides the entry
 * point but a direct URL would otherwise render the client chat UI; only
 * the per-message API calls would then fail auth-side, producing a
 * confusing partial-render.
 */

import { Metadata } from 'next'
import { requireSection } from '@/lib/admin/guards'
import HirnPageClient from './HirnPageClient'

export const metadata: Metadata = {
  title: 'Hirn AI',
  description: 'AI-Assistent für RevampIT.',
}

export default async function AdminHirnPage() {
  await requireSection('hirn')
  return <HirnPageClient />
}
