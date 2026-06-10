/**
 * Admin Donations Page - Server Component (auth gate)
 *
 * Belt-and-suspenders page-level access check for the sensitive
 * `donations` section. The admin layout already enforces auth +
 * is_staff; this redirects to the admin home with a flag when the
 * staff member lacks the specific section permission.
 */

import { Metadata } from 'next'
import { requireSection } from '@/lib/admin/guards'
import DonationsPageClient from './DonationsPageClient'

export const metadata: Metadata = {
  title: 'Spenden',
  description: 'Geld- und Sachspenden verwalten.',
}

export default async function AdminDonationsPage() {
  await requireSection('donations')
  return <DonationsPageClient />
}
