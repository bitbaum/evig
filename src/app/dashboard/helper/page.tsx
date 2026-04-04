import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { helperProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { IT_HILFE } from '@/config/it-hilfe'
import HelperDashboardClient from './HelperDashboardClient'

export const metadata: Metadata = {
  title: 'IT-Hilfe Dashboard | RevampIT',
  description: 'Verwalten Sie Ihre IT-Hilfe-Angebote und finden Sie passende Anfragen.',
}

export default async function HelperDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/dashboard/helper')
  }

  // Check if user has a helper profile
  const [profile] = await db
    .select({ id: helperProfiles.id, isActive: helperProfiles.isActive })
    .from(helperProfiles)
    .where(eq(helperProfiles.userId, session.user.id))

  if (!profile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            IT-Hilfe Helfer werden
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie ein Helferprofil und tragen Sie Ihre Skills ein, um passende
            IT-Hilfe-Anfragen aus der Community zu erhalten.
          </p>
          <Link
            href={IT_HILFE.routes.register}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Profil erstellen
          </Link>
        </div>
      </div>
    )
  }

  return <HelperDashboardClient />
}
